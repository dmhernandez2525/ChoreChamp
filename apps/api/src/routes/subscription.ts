import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';
import { db } from '../lib/db';
import { households, members } from '@chorechamp/database/schema';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { createLogger } from '../lib/logger';
import { requireStripe, getStripeWebhookSecret } from '../lib/stripe';
import {
  TRIAL_DAYS,
  subscriptionPlans,
  buildSubscriptionSummary,
  getMemberLimitForTier,
  getGracePeriodDays,
  resolveGrandfathered,
  mapStripeStatus,
} from '../lib/subscription';
import type {
  BillingInterval,
  CreateCheckoutSessionRequest,
  CreatePortalSessionRequest,
  RevenueCatSyncRequest,
  SubscriptionTier,
} from '@chorechamp/types';

const logger = createLogger('subscription');

const checkoutSchema = z.object({
  tier: z.enum(['family', 'premium']),
  billingInterval: z.enum(['monthly', 'annual']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const portalSchema = z.object({
  returnUrl: z.string().url(),
});

const revenuecatSchema = z.object({
  appUserId: z.string().min(1),
  householdId: z.string().uuid(),
  tier: z.enum(['family', 'premium']),
  store: z.enum(['app_store', 'play_store', 'web']),
  status: z.enum(['trialing', 'active', 'past_due', 'grace_period', 'canceled', 'expired']),
  currentPeriodEnd: z.string().nullable(),
  isTrial: z.boolean(),
});

async function verifyMembership(userId: string, householdId: string) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.householdId, householdId), eq(members.userId, userId)));
  return membership || null;
}

async function verifyParentMembership(userId: string, householdId: string) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId),
      eq(members.role, 'parent')
    ));
  return membership || null;
}

function resolveStripePriceId(
  tier: SubscriptionTier,
  billingInterval: BillingInterval,
  isGrandfathered: boolean
): string {
  if (tier === 'free') {
    throw new Error('Free tier does not have a Stripe price');
  }

  const priceMap: Record<Exclude<SubscriptionTier, 'free'>, Record<BillingInterval, string | undefined>> = {
    family: {
      monthly: isGrandfathered
        ? process.env.STRIPE_PRICE_FAMILY_MONTHLY_GRANDFATHERED
        : process.env.STRIPE_PRICE_FAMILY_MONTHLY,
      annual: isGrandfathered
        ? process.env.STRIPE_PRICE_FAMILY_ANNUAL_GRANDFATHERED
        : process.env.STRIPE_PRICE_FAMILY_ANNUAL,
    },
    premium: {
      monthly: isGrandfathered
        ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY_GRANDFATHERED
        : process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      annual: isGrandfathered
        ? process.env.STRIPE_PRICE_PREMIUM_ANNUAL_GRANDFATHERED
        : process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
    },
  };

  const priceId = priceMap[tier][billingInterval];
  if (!priceId) {
    throw new Error(`Missing Stripe price for ${tier} ${billingInterval}`);
  }
  return priceId;
}

function resolveTierFromMetadata(subscription: Stripe.Subscription): SubscriptionTier {
  const tier = subscription.metadata?.tier as SubscriptionTier | undefined;
  if (tier === 'family' || tier === 'premium') {
    return tier;
  }
  const priceId = subscription.items.data[0]?.price?.id;
  const familyPrices = [
    process.env.STRIPE_PRICE_FAMILY_MONTHLY,
    process.env.STRIPE_PRICE_FAMILY_ANNUAL,
    process.env.STRIPE_PRICE_FAMILY_MONTHLY_GRANDFATHERED,
    process.env.STRIPE_PRICE_FAMILY_ANNUAL_GRANDFATHERED,
  ].filter((price): price is string => Boolean(price));
  const premiumPrices = [
    process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
    process.env.STRIPE_PRICE_PREMIUM_MONTHLY_GRANDFATHERED,
    process.env.STRIPE_PRICE_PREMIUM_ANNUAL_GRANDFATHERED,
  ].filter((price): price is string => Boolean(price));

  if (priceId && familyPrices.includes(priceId)) return 'family';
  if (priceId && premiumPrices.includes(priceId)) return 'premium';
  return 'free';
}

function resolveBillingInterval(subscription: Stripe.Subscription): BillingInterval | null {
  const item = subscription.items.data[0];
  if (!item?.plan?.interval) return null;
  return item.plan.interval === 'year' ? 'annual' : 'monthly';
}

async function findHouseholdByStripeIds(
  subscriptionId?: string | null,
  customerId?: string | null
) {
  if (subscriptionId) {
    const [householdBySubscription] = await db
      .select()
      .from(households)
      .where(eq(households.stripeSubscriptionId, subscriptionId));
    if (householdBySubscription) return householdBySubscription;
  }

  if (customerId) {
    const [householdByCustomer] = await db
      .select()
      .from(households)
      .where(eq(households.stripeCustomerId, customerId));
    if (householdByCustomer) return householdByCustomer;
  }

  return null;
}

async function updateHouseholdFromStripeSubscription(
  householdId: string,
  subscription: Stripe.Subscription
) {
  const [existing] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId));

  if (!existing) return;

  const tier = resolveTierFromMetadata(subscription);
  const billingInterval = resolveBillingInterval(subscription);
  const status = mapStripeStatus(subscription.status);

  const currentPeriodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : null;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null;

  const isExpired = status === 'canceled' && currentPeriodEnd
    ? currentPeriodEnd.getTime() < Date.now()
    : status === 'expired';

  const effectiveTier: SubscriptionTier = isExpired ? 'free' : tier;
  const gracePeriodEndsAt =
    status === 'past_due' || status === 'grace_period'
      ? existing.subscriptionGracePeriodEndsAt
      : null;

  await db
    .update(households)
    .set({
      subscriptionTier: effectiveTier,
      subscriptionStatus: isExpired ? 'expired' : status,
      subscriptionProvider: 'stripe',
      subscriptionStore: 'web',
      subscriptionBillingInterval: billingInterval,
      subscriptionCurrentPeriodStart: currentPeriodStart,
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
      subscriptionExpiresAt: currentPeriodEnd,
      subscriptionTrialEndsAt: trialEndsAt,
      subscriptionGracePeriodEndsAt: gracePeriodEndsAt,
      subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      subscriptionCanceledAt: canceledAt,
      subscriptionMemberLimit: getMemberLimitForTier(effectiveTier),
      stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null,
      stripeSubscriptionId: subscription.id,
      updatedAt: new Date(),
    })
    .where(eq(households.id, householdId));
}

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // List plans
  fastify.get('/:householdId/plans', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    return reply.send({
      plans: subscriptionPlans,
      trialDays: TRIAL_DAYS,
    });
  });

  // Subscription status
  fastify.get('/:householdId/status', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId));

    if (!household) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Household not found',
      });
    }

    return reply.send({
      subscription: buildSubscriptionSummary(household),
    });
  });

  // Create Stripe checkout session
  fastify.post('/:householdId/checkout', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = checkoutSchema.parse(request.body) as CreateCheckoutSessionRequest;

    const membership = await verifyParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can manage subscriptions',
      });
    }

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId));

    if (!household) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Household not found',
      });
    }

    let stripe: Stripe;
    try {
      stripe = requireStripe();
    } catch {
      return reply.status(500).send({
        error: 'Server Error',
        message: 'Stripe is not configured',
      });
    }
    const isGrandfathered = resolveGrandfathered(household);
    let priceId: string;
    try {
      priceId = resolveStripePriceId(body.tier, body.billingInterval, isGrandfathered);
    } catch (error) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error instanceof Error ? error.message : 'Invalid price configuration',
      });
    }

    if (isGrandfathered && !household.subscriptionIsGrandfathered) {
      await db
        .update(households)
        .set({
          subscriptionIsGrandfathered: true,
          updatedAt: new Date(),
        })
        .where(eq(households.id, householdId));
    }

    const alreadyHadTrial = household.subscriptionTrialEndsAt || household.subscriptionStatus === 'trialing';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: household.stripeCustomerId ?? undefined,
      customer_email: household.stripeCustomerId ? undefined : user.email,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: alreadyHadTrial ? undefined : TRIAL_DAYS,
        metadata: {
          householdId,
          tier: body.tier,
          billingInterval: body.billingInterval,
          grandfathered: isGrandfathered ? 'true' : 'false',
          userId: user.id,
        },
      },
      metadata: {
        householdId,
        tier: body.tier,
        billingInterval: body.billingInterval,
        grandfathered: isGrandfathered ? 'true' : 'false',
        userId: user.id,
      },
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
    });

    if (!session.url) {
      return reply.status(500).send({
        error: 'Server Error',
        message: 'Failed to create checkout session',
      });
    }

    return reply.send({ url: session.url });
  });

  // Stripe billing portal
  fastify.post('/:householdId/portal', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = portalSchema.parse(request.body) as CreatePortalSessionRequest;

    const membership = await verifyParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can manage subscriptions',
      });
    }

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId));

    if (!household?.stripeCustomerId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No Stripe customer found for this household',
      });
    }

    let stripe: Stripe;
    try {
      stripe = requireStripe();
    } catch {
      return reply.status(500).send({
        error: 'Server Error',
        message: 'Stripe is not configured',
      });
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: household.stripeCustomerId,
      return_url: body.returnUrl,
    });

    return reply.send({ url: portalSession.url });
  });

  // RevenueCat sync
  fastify.post('/:householdId/revenuecat/sync', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = revenuecatSchema.parse(request.body) as RevenueCatSyncRequest;

    if (body.householdId !== householdId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Household mismatch',
      });
    }

    const membership = await verifyParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can sync subscriptions',
      });
    }

    const currentPeriodEnd = body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : null;
    const trialEndsAt = body.isTrial ? currentPeriodEnd : null;

    const [updated] = await db
      .update(households)
      .set({
      subscriptionTier: body.tier,
      subscriptionStatus: body.status,
      subscriptionProvider: 'revenuecat',
      subscriptionStore: body.store,
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
      subscriptionExpiresAt: currentPeriodEnd,
      subscriptionTrialEndsAt: trialEndsAt,
      subscriptionMemberLimit: getMemberLimitForTier(body.tier),
        revenuecatAppUserId: body.appUserId,
        updatedAt: new Date(),
      })
      .where(eq(households.id, householdId))
      .returning();

    if (!updated) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Household not found',
      });
    }

    return reply.send({
      subscription: buildSubscriptionSummary(updated),
    });
  });

  // Stripe webhook
  fastify.post('/webhook/stripe', {
    config: {
      rawBody: true,
    },
  }, async (request, reply) => {
    let stripe: Stripe;
    try {
      stripe = requireStripe();
    } catch {
      return reply.status(500).send({ error: 'Stripe is not configured' });
    }

    let secret: string;
    try {
      secret = getStripeWebhookSecret();
    } catch {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return reply.status(500).send({ error: 'Webhook secret not configured' });
    }

    const signatureHeader = request.headers['stripe-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (!signature) {
      return reply.status(400).send({ error: 'Missing Stripe signature header' });
    }

    let event: Stripe.Event;
    try {
      const rawBody = (request as { rawBody?: string }).rawBody;
      if (!rawBody) {
        return reply.status(400).send({ error: 'Missing raw body' });
      }
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (error) {
      logger.error({ error }, 'Stripe webhook signature verification failed');
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const householdId = session.metadata?.householdId;
          if (!householdId || typeof householdId !== 'string') {
            break;
          }

          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;
          const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;

          if (customerId) {
            await db
              .update(households)
              .set({
                stripeCustomerId: customerId,
                updatedAt: new Date(),
              })
              .where(eq(households.id, householdId));
          }

          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await updateHouseholdFromStripeSubscription(householdId, subscription);
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const householdId = subscription.metadata?.householdId || null;
          if (householdId && typeof householdId === 'string') {
            await updateHouseholdFromStripeSubscription(householdId, subscription);
          } else {
            const household = await findHouseholdByStripeIds(subscription.id, subscription.customer as string);
            if (household) {
              await updateHouseholdFromStripeSubscription(household.id, subscription);
            } else {
              logger.warn(
                { subscriptionId: subscription.id, customerId: subscription.customer, eventType: event.type },
                'Webhook received but household not found - subscription may be orphaned'
              );
            }
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const household = await findHouseholdByStripeIds(
            typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id,
            typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
          );
          if (household) {
            const graceDays = getGracePeriodDays();
            const gracePeriodEndsAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);
            await db
              .update(households)
              .set({
                subscriptionStatus: 'grace_period',
                subscriptionGracePeriodEndsAt: gracePeriodEndsAt,
                updatedAt: new Date(),
              })
              .where(eq(households.id, household.id));
          }
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const household = await findHouseholdByStripeIds(
            typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id,
            typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
          );
          if (household) {
            await db
              .update(households)
              .set({
                subscriptionStatus: 'active',
                subscriptionGracePeriodEndsAt: null,
                updatedAt: new Date(),
              })
              .where(eq(households.id, household.id));
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      logger.error({ error, eventType: event.type }, 'Stripe webhook processing failed');
      return reply.status(500).send({ error: 'Webhook processing failed' });
    }

    return reply.send({ received: true });
  });
}
