import { randomBytes, createHash, createHmac } from 'crypto';
import { FastifyInstance, FastifyReply } from 'fastify';
import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../lib/db';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import {
  apiKeys,
  apiKeySettings,
  apiKeyUsageEvents,
  apiSdkPackages,
  chores,
  households,
  integrationAppRequests,
  integrationMarketplaceApps,
  members,
  oauthAccessTokens,
  oauthAuthorizationCodes,
  oauthClients,
  webhookDeliveries,
  webhookSubscriptions,
} from '@chorechamp/database';
import { getEffectiveTierForHousehold, isTierAtLeast } from '../lib/subscription';
import { verifyMembership } from '../lib/membership';
import { optionalApiKeyAuth, type ApiKeyAuthenticatedRequest } from '../middleware/api-key-auth';
import { createLogger } from '../lib/logger';
import type {
  ApiPlatformDeveloperOverview,
  ApiPlatformOpenApiDocument,
  ApiPlatformScope,
  ApiPlatformWebhookEventType,
  ApiPlatformWebhookStatus,
} from '@chorechamp/types';

const logger = createLogger('api-platform');

const allowedScopes: ApiPlatformScope[] = [
  'chores:read',
  'chores:write',
  'members:read',
  'rewards:read',
  'webhooks:write',
  'analytics:read',
  'marketplace:read',
];

const webhookEventTypes: ApiPlatformWebhookEventType[] = [
  'chore.completed',
  'reward.claimed',
  'streak.updated',
  'member.invited',
  'assignment.submitted',
];

const webhookStatusValues: ApiPlatformWebhookStatus[] = ['active', 'paused', 'disabled'];
const updateApiKeySettingsSchema = z.object({
  scopes: z.array(z.enum(allowedScopes as [ApiPlatformScope, ...ApiPlatformScope[]])).optional(),
  rateLimitPerMinute: z.number().int().min(10).max(5000).optional(),
});

const createWebhookSchema = z.object({
  name: z.string().min(1).max(120),
  targetUrl: z.string().url(),
  secret: z.string().min(8).max(120),
  eventTypes: z
    .array(z.enum(webhookEventTypes as [ApiPlatformWebhookEventType, ...ApiPlatformWebhookEventType[]]))
    .min(1),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  targetUrl: z.string().url().optional(),
  secret: z.string().min(8).max(120).optional(),
  eventTypes: z
    .array(z.enum(webhookEventTypes as [ApiPlatformWebhookEventType, ...ApiPlatformWebhookEventType[]]))
    .min(1)
    .optional(),
  status: z.enum(webhookStatusValues as [ApiPlatformWebhookStatus, ...ApiPlatformWebhookStatus[]]).optional(),
});

const emitWebhookSchema = z.object({
  eventType: z.enum(webhookEventTypes as [ApiPlatformWebhookEventType, ...ApiPlatformWebhookEventType[]]),
  payload: z.record(z.string(), z.unknown()),
});

const createOAuthClientSchema = z.object({
  name: z.string().min(1).max(160),
  redirectUris: z.array(z.string().url()).min(1),
  scopes: z.array(z.enum(allowedScopes as [ApiPlatformScope, ...ApiPlatformScope[]])).min(1),
});

const authorizeOAuthSchema = z.object({
  clientId: z.string().min(8).max(80),
  householdId: z.string().uuid(),
  redirectUri: z.string().url(),
  scopes: z.array(z.enum(allowedScopes as [ApiPlatformScope, ...ApiPlatformScope[]])).min(1),
});

const exchangeOAuthTokenSchema = z.object({
  clientId: z.string().min(8).max(80),
  clientSecret: z.string().min(12).max(120),
  code: z.string().min(16).max(128),
  redirectUri: z.string().url(),
});

const createMarketplaceRequestSchema = z.object({
  appId: z.string().uuid(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

const reviewMarketplaceRequestSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reviewNote: z.string().max(1000).optional(),
});

const sdkPackageSchema = z.object({
  language: z.enum(['javascript', 'python', 'swift', 'kotlin']),
  packageName: z.string().min(1).max(160),
  version: z.string().min(1).max(40),
  repoUrl: z.string().url(),
  docsUrl: z.string().url(),
  installCommand: z.string().min(1).max(200),
});

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function generateSecret(prefix: 'cc_oauth_' | 'cc_client_' = 'cc_oauth_'): string {
  return `${prefix}${randomBytes(24).toString('hex')}`;
}

function generateCode(length = 48): string {
  return randomBytes(length / 2).toString('hex');
}

function getApiBaseUrl(): string {
  return process.env.BETTER_AUTH_URL || 'https://chorechamp-api-u0o9.onrender.com';
}

async function requireParentMembership(userId: string, householdId: string) {
  const membership = await verifyMembership(userId, householdId);
  if (!membership || membership.role !== 'parent') return null;
  return membership;
}

async function ensurePremiumHousehold(householdId: string): Promise<boolean> {
  const [household] = await db.select().from(households).where(eq(households.id, householdId));
  if (!household) return false;
  const tier = getEffectiveTierForHousehold(household);
  return isTierAtLeast(tier, 'premium');
}

async function requirePremiumHouseholdReply(
  householdId: string,
  reply: FastifyReply
): Promise<boolean> {
  const hasPremium = await ensurePremiumHousehold(householdId);
  if (!hasPremium) {
    reply.status(403).send({
      error: 'Forbidden',
      message: 'Developer platform requires a Premium subscription.',
    });
    return false;
  }
  return true;
}

async function seedMarketplaceApps() {
  const [existingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(integrationMarketplaceApps);

  if ((existingCount?.count ?? 0) > 0) return;

  const now = new Date();

  await db.insert(integrationMarketplaceApps).values([
    {
      slug: 'zapier',
      name: 'Zapier',
      vendor: 'Zapier Inc.',
      description: 'Trigger and automate ChoreChamp events across 7000+ apps.',
      category: 'automation',
      websiteUrl: 'https://zapier.com',
      installUrl: 'https://zapier.com/apps/chorechamp/integrations',
      logoUrl: null,
      pricingSummary: 'Free and paid tiers',
      isVerified: true,
      status: 'active',
      supportedEventTypes: webhookEventTypes,
      createdAt: now,
      updatedAt: now,
    },
    {
      slug: 'make',
      name: 'Make.com',
      vendor: 'Celonis',
      description: 'Visual workflow automation for ChoreChamp webhooks and API endpoints.',
      category: 'automation',
      websiteUrl: 'https://www.make.com',
      installUrl: 'https://www.make.com/en/integrations/chorechamp',
      logoUrl: null,
      pricingSummary: 'Operations-based pricing',
      isVerified: true,
      status: 'active',
      supportedEventTypes: webhookEventTypes,
      createdAt: now,
      updatedAt: now,
    },
    {
      slug: 'ifttt',
      name: 'IFTTT',
      vendor: 'IFTTT Inc.',
      description: 'Simple applets for home automations and family reminder automations.',
      category: 'smart-home',
      websiteUrl: 'https://ifttt.com',
      installUrl: 'https://ifttt.com/chorechamp',
      logoUrl: null,
      pricingSummary: 'Free and Pro',
      isVerified: true,
      status: 'active',
      supportedEventTypes: ['chore.completed', 'reward.claimed', 'member.invited'],
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

async function seedSdkPackages() {
  const [existingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiSdkPackages);

  if ((existingCount?.count ?? 0) > 0) return;

  const now = new Date();

  await db.insert(apiSdkPackages).values([
    {
      language: 'javascript',
      packageName: '@chorechamp/sdk-js',
      version: '1.0.0',
      repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/javascript',
      docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/javascript/README.md',
      installCommand: 'npm install @chorechamp/sdk-js',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      language: 'python',
      packageName: 'chorechamp-sdk',
      version: '1.0.0',
      repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/python',
      docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/python/README.md',
      installCommand: 'pip install chorechamp-sdk',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      language: 'swift',
      packageName: 'ChoreChampSDK',
      version: '1.0.0',
      repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/swift',
      docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/swift/README.md',
      installCommand: 'Swift Package Manager URL import',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      language: 'kotlin',
      packageName: 'com.chorechamp:sdk-kotlin',
      version: '1.0.0',
      repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/kotlin',
      docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/kotlin/README.md',
      installCommand: 'implementation("com.chorechamp:sdk-kotlin:1.0.0")',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

export function buildOpenApiDocument(): ApiPlatformOpenApiDocument {
  return {
    openapi: '3.1.0',
    info: {
      title: 'ChoreChamp Public API',
      version: '1.0.0',
      description:
        'Public API for ChoreChamp integrations. Authenticate with API keys or OAuth2 bearer tokens.',
    },
    servers: [
      {
        url: `${getApiBaseUrl()}/api/public/v1`,
        description: 'Production API',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
        OAuth2: {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: `${getApiBaseUrl()}/api/oauth/token`,
              scopes: {
                'chores:read': 'Read chores',
                'members:read': 'Read members',
                'webhooks:write': 'Emit webhook events',
              },
            },
          },
        },
      },
    },
    paths: {
      '/households/{householdId}/chores': {
        get: {
          summary: 'List chores for a household',
          security: [{ ApiKeyAuth: [] }, { OAuth2: [] }],
        },
      },
      '/households/{householdId}/members': {
        get: {
          summary: 'List household members',
          security: [{ ApiKeyAuth: [] }, { OAuth2: [] }],
        },
      },
      '/households/{householdId}/events/{eventType}': {
        post: {
          summary: 'Emit an integration webhook event',
          security: [{ ApiKeyAuth: [] }, { OAuth2: [] }],
        },
      },
    },
  };
}

async function getOrCreateApiKeySettings(apiKeyId: string) {
  const [existing] = await db.select().from(apiKeySettings).where(eq(apiKeySettings.apiKeyId, apiKeyId));
  if (existing) return existing;

  const [created] = await db
    .insert(apiKeySettings)
    .values({
      apiKeyId,
      scopes: ['chores:read', 'members:read'],
      rateLimitPerMinute: 120,
      requestsToday: 0,
      lastRequestAt: null,
      lastResetDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

async function enforceApiKeyRateLimit(apiKeyId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
  const settings = await getOrCreateApiKeySettings(apiKeyId);
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const [usageCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiKeyUsageEvents)
    .where(and(eq(apiKeyUsageEvents.apiKeyId, apiKeyId), gte(apiKeyUsageEvents.createdAt, oneMinuteAgo)));

  const used = usageCount?.count ?? 0;
  if (used >= settings.rateLimitPerMinute) {
    return { allowed: false, limit: settings.rateLimitPerMinute, used };
  }

  return { allowed: true, limit: settings.rateLimitPerMinute, used };
}

async function recordApiKeyUsage(input: {
  apiKeyId: string;
  householdId: string;
  requestPath: string;
  requestMethod: string;
  statusCode: number;
  responseTimeMs: number;
}) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const settings = await getOrCreateApiKeySettings(input.apiKeyId);
  const shouldReset = settings.lastResetDate !== today;

  await db.insert(apiKeyUsageEvents).values({
    apiKeyId: input.apiKeyId,
    householdId: input.householdId,
    requestPath: input.requestPath,
    requestMethod: input.requestMethod,
    statusCode: input.statusCode,
    responseTimeMs: Math.max(0, Math.round(input.responseTimeMs)),
    createdAt: now,
  });

  await db
    .update(apiKeySettings)
    .set({
      requestsToday: shouldReset ? 1 : settings.requestsToday + 1,
      lastResetDate: today,
      lastRequestAt: now,
      updatedAt: now,
    })
    .where(eq(apiKeySettings.apiKeyId, input.apiKeyId));
}

async function resolveOAuthToken(
  token: string
): Promise<
  | {
      householdId: string;
      memberId: string;
      scopes: string[];
      tokenHash: string;
    }
  | null
> {
  if (!token.startsWith('cc_oauth_')) return null;

  const tokenHash = hashValue(token);
  const now = new Date();

  const [record] = await db
    .select()
    .from(oauthAccessTokens)
    .where(
      and(
        eq(oauthAccessTokens.tokenHash, tokenHash),
        isNull(oauthAccessTokens.revokedAt),
        gte(oauthAccessTokens.expiresAt, now)
      )
    );

  if (!record) return null;

  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, record.householdId));

  if (!household) return null;
  const tier = getEffectiveTierForHousehold(household);
  if (!isTierAtLeast(tier, 'premium')) return null;

  await db
    .update(oauthAccessTokens)
    .set({ lastUsedAt: now })
    .where(eq(oauthAccessTokens.tokenHash, tokenHash));

  return {
    householdId: record.householdId,
    memberId: record.memberId,
    scopes: record.scopes,
    tokenHash,
  };
}

function extractBearerToken(headers: Record<string, unknown>): string | null {
  const authHeader = headers.authorization;
  if (typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

async function dispatchWebhookEvent(input: {
  householdId: string;
  eventType: ApiPlatformWebhookEventType;
  payload: Record<string, unknown>;
}) {
  const subscriptions = await db
    .select()
    .from(webhookSubscriptions)
    .where(
      and(
        eq(webhookSubscriptions.householdId, input.householdId),
        eq(webhookSubscriptions.status, 'active')
      )
    );

  const relevantSubscriptions = subscriptions.filter((subscription) =>
    subscription.eventTypes.includes(input.eventType)
  );

  const createdAt = new Date();

  for (const subscription of relevantSubscriptions) {
    const payload = {
      eventId: generateCode(24),
      eventType: input.eventType,
      householdId: input.householdId,
      occurredAt: createdAt.toISOString(),
      data: input.payload,
    };

    const body = JSON.stringify(payload);
    const signature = createHmac('sha256', subscription.secretHash).update(body).digest('hex');

    const [delivery] = await db
      .insert(webhookDeliveries)
      .values({
        subscriptionId: subscription.id,
        householdId: input.householdId,
        eventType: input.eventType,
        payload: payload as Record<string, unknown>,
        status: 'pending',
        responseStatus: null,
        responseBody: null,
        attemptCount: 1,
        deliveredAt: null,
        createdAt,
      })
      .returning();

    try {
      const response = await fetch(subscription.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ChoreChamp-Signature': signature,
          'X-ChoreChamp-Event': input.eventType,
        },
        body,
      });

      const responseBody = await response.text();
      const delivered = response.ok;

      await db
        .update(webhookDeliveries)
        .set({
          status: delivered ? 'delivered' : 'failed',
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 3000),
          deliveredAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      await db
        .update(webhookSubscriptions)
        .set({
          lastTriggeredAt: new Date(),
          failureCount: delivered ? 0 : subscription.failureCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(webhookSubscriptions.id, subscription.id));
    } catch (error) {
      logger.error({ error, subscriptionId: subscription.id }, 'Webhook delivery failed');

      await db
        .update(webhookDeliveries)
        .set({
          status: 'failed',
          responseStatus: null,
          responseBody: error instanceof Error ? error.message.slice(0, 3000) : 'Unknown error',
          deliveredAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      await db
        .update(webhookSubscriptions)
        .set({
          failureCount: subscription.failureCount + 1,
          lastTriggeredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(webhookSubscriptions.id, subscription.id));
    }
  }

  return relevantSubscriptions.length;
}

async function computeUsageSummary(householdId: string) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiKeyUsageEvents)
    .where(eq(apiKeyUsageEvents.householdId, householdId));

  const [lastDay] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiKeyUsageEvents)
    .where(and(eq(apiKeyUsageEvents.householdId, householdId), gte(apiKeyUsageEvents.createdAt, yesterday)));

  const [failuresLastDay] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiKeyUsageEvents)
    .where(
      and(
        eq(apiKeyUsageEvents.householdId, householdId),
        gte(apiKeyUsageEvents.createdAt, yesterday),
        gte(apiKeyUsageEvents.statusCode, 400)
      )
    );

  const [avgResponse] = await db
    .select({ average: sql<number>`coalesce(avg(${apiKeyUsageEvents.responseTimeMs}), 0)::int` })
    .from(apiKeyUsageEvents)
    .where(and(eq(apiKeyUsageEvents.householdId, householdId), gte(apiKeyUsageEvents.createdAt, yesterday)));

  const topEndpoints = await db
    .select({
      path: apiKeyUsageEvents.requestPath,
      requests: sql<number>`count(*)::int`,
    })
    .from(apiKeyUsageEvents)
    .where(and(eq(apiKeyUsageEvents.householdId, householdId), gte(apiKeyUsageEvents.createdAt, yesterday)))
    .groupBy(apiKeyUsageEvents.requestPath)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  return {
    totalRequests: total?.count ?? 0,
    requestsLast24Hours: lastDay?.count ?? 0,
    failuresLast24Hours: failuresLastDay?.count ?? 0,
    averageResponseMs: avgResponse?.average ?? 0,
    topEndpoints,
  };
}

async function requirePublicScope(request: ApiKeyAuthenticatedRequest, scope: ApiPlatformScope) {
  const settings = await getOrCreateApiKeySettings(request.apiKey.id);
  if (!settings.scopes.includes(scope)) {
    return { allowed: false, scopes: settings.scopes };
  }
  return { allowed: true, scopes: settings.scopes };
}

export async function developerApiPlatformRoutes(fastify: FastifyInstance) {
  fastify.get('/developer/overview', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    await seedMarketplaceApps();
    await seedSdkPackages();

    const usage = await computeUsageSummary(householdId);

    const [webhookCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.householdId, householdId));

    const [oauthClientCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(oauthClients)
      .where(eq(oauthClients.householdId, householdId));

    const [requestCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(integrationAppRequests)
      .where(eq(integrationAppRequests.householdId, householdId));

    const [sdkCount] = await db.select({ count: sql<number>`count(*)::int` }).from(apiSdkPackages);

    const response: ApiPlatformDeveloperOverview = {
      usage,
      webhookCount: webhookCount?.count ?? 0,
      oauthClientCount: oauthClientCount?.count ?? 0,
      marketplaceRequestCount: requestCount?.count ?? 0,
      sdkPackageCount: sdkCount?.count ?? 0,
    };

    return response;
  });

  fastify.get('/developer/openapi', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    return buildOpenApiDocument();
  });

  fastify.get('/developer/api-keys', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const keys = await db
      .select({
        id: apiKeys.id,
        householdId: apiKeys.householdId,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdByMemberId: apiKeys.createdByMemberId,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.householdId, householdId), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt));

    const keyIds = keys.map((key) => key.id);
    const settings = keyIds.length
      ? await db.select().from(apiKeySettings).where(inArray(apiKeySettings.apiKeyId, keyIds))
      : [];

    const settingsMap = new Map(settings.map((setting) => [setting.apiKeyId, setting]));

    return {
      keys: keys.map((key) => ({
        ...key,
        settings: settingsMap.get(key.id) ?? null,
      })),
    };
  });

  fastify.patch('/developer/api-keys/:keyId/settings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, keyId } = request.params as { householdId: string; keyId: string };
    const body = updateApiKeySettingsSchema.parse(request.body);

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.householdId, householdId)));

    if (!apiKey) {
      return reply.status(404).send({ error: 'Not Found', message: 'API key not found.' });
    }

    const existing = await getOrCreateApiKeySettings(keyId);

    const [updated] = await db
      .update(apiKeySettings)
      .set({
        scopes: body.scopes ?? existing.scopes,
        rateLimitPerMinute: body.rateLimitPerMinute ?? existing.rateLimitPerMinute,
        updatedAt: new Date(),
      })
      .where(eq(apiKeySettings.apiKeyId, keyId))
      .returning();

    return updated;
  });

  fastify.get('/developer/api-keys/:keyId/usage', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, keyId } = request.params as { householdId: string; keyId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const usage = await db
      .select()
      .from(apiKeyUsageEvents)
      .where(and(eq(apiKeyUsageEvents.householdId, householdId), eq(apiKeyUsageEvents.apiKeyId, keyId)))
      .orderBy(desc(apiKeyUsageEvents.createdAt))
      .limit(200);

    return { usage };
  });

  fastify.get('/developer/webhooks', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const subscriptions = await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.householdId, householdId))
      .orderBy(desc(webhookSubscriptions.createdAt));

    return { subscriptions };
  });

  fastify.post('/developer/webhooks', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createWebhookSchema.parse(request.body);

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const [created] = await db
      .insert(webhookSubscriptions)
      .values({
        householdId,
        createdByMemberId: membership.id,
        name: body.name,
        targetUrl: body.targetUrl,
        secretHash: hashValue(body.secret),
        eventTypes: body.eventTypes,
        status: 'active',
        failureCount: 0,
        lastTriggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });

  fastify.patch('/developer/webhooks/:subscriptionId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, subscriptionId } = request.params as {
      householdId: string;
      subscriptionId: string;
    };
    const body = updateWebhookSchema.parse(request.body);

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const [subscription] = await db
      .select()
      .from(webhookSubscriptions)
      .where(
        and(
          eq(webhookSubscriptions.id, subscriptionId),
          eq(webhookSubscriptions.householdId, householdId)
        )
      );

    if (!subscription) {
      return reply.status(404).send({ error: 'Not Found', message: 'Webhook subscription not found.' });
    }

    const [updated] = await db
      .update(webhookSubscriptions)
      .set({
        name: body.name ?? subscription.name,
        targetUrl: body.targetUrl ?? subscription.targetUrl,
        secretHash: body.secret ? hashValue(body.secret) : subscription.secretHash,
        eventTypes: body.eventTypes ?? subscription.eventTypes,
        status: body.status ?? subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(webhookSubscriptions.id, subscriptionId))
      .returning();

    return updated;
  });

  fastify.post('/developer/webhooks/emit', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = emitWebhookSchema.parse(request.body);

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const dispatchedCount = await dispatchWebhookEvent({
      householdId,
      eventType: body.eventType,
      payload: body.payload,
    });

    return { dispatchedCount };
  });

  fastify.get('/developer/webhooks/deliveries', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const deliveries = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.householdId, householdId))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(250);

    return { deliveries };
  });

  fastify.get('/developer/marketplace/apps', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Household membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    await seedMarketplaceApps();

    const apps = await db
      .select()
      .from(integrationMarketplaceApps)
      .where(eq(integrationMarketplaceApps.status, 'active'))
      .orderBy(integrationMarketplaceApps.name);

    return { apps };
  });

  fastify.get('/developer/marketplace/requests', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Household membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const requests = await db
      .select()
      .from(integrationAppRequests)
      .where(eq(integrationAppRequests.householdId, householdId))
      .orderBy(desc(integrationAppRequests.requestedAt));

    return { requests };
  });

  fastify.post('/developer/marketplace/requests', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createMarketplaceRequestSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Household membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const [app] = await db
      .select()
      .from(integrationMarketplaceApps)
      .where(eq(integrationMarketplaceApps.id, body.appId));

    if (!app || app.status !== 'active') {
      return reply.status(404).send({ error: 'Not Found', message: 'Marketplace app not found.' });
    }

    const [existing] = await db
      .select()
      .from(integrationAppRequests)
      .where(
        and(
          eq(integrationAppRequests.householdId, householdId),
          eq(integrationAppRequests.appId, app.id)
        )
      );

    if (existing) {
      return reply.status(409).send({ error: 'Conflict', message: 'Request already exists for this app.' });
    }

    const [created] = await db
      .insert(integrationAppRequests)
      .values({
        householdId,
        appId: app.id,
        requestedByMemberId: membership.id,
        status: 'pending',
        requestedAt: new Date(),
        reviewedByMemberId: null,
        reviewedAt: null,
        reviewNote: null,
        configuration: body.configuration ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });

  fastify.post('/developer/marketplace/requests/:requestId/review', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, requestId } = request.params as { householdId: string; requestId: string };
    const body = reviewMarketplaceRequestSchema.parse(request.body);

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const [requestRecord] = await db
      .select()
      .from(integrationAppRequests)
      .where(
        and(
          eq(integrationAppRequests.id, requestId),
          eq(integrationAppRequests.householdId, householdId)
        )
      );

    if (!requestRecord) {
      return reply.status(404).send({ error: 'Not Found', message: 'Marketplace request not found.' });
    }

    const [updated] = await db
      .update(integrationAppRequests)
      .set({
        status: body.decision === 'approve' ? 'approved' : 'rejected',
        reviewedByMemberId: membership.id,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote ?? null,
        updatedAt: new Date(),
      })
      .where(eq(integrationAppRequests.id, requestId))
      .returning();

    return updated;
  });

  fastify.get('/developer/oauth/clients', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const clients = await db
      .select({
        id: oauthClients.id,
        householdId: oauthClients.householdId,
        createdByMemberId: oauthClients.createdByMemberId,
        name: oauthClients.name,
        clientId: oauthClients.clientId,
        redirectUris: oauthClients.redirectUris,
        scopes: oauthClients.scopes,
        isActive: oauthClients.isActive,
        createdAt: oauthClients.createdAt,
        updatedAt: oauthClients.updatedAt,
      })
      .from(oauthClients)
      .where(eq(oauthClients.householdId, householdId))
      .orderBy(desc(oauthClients.createdAt));

    return { clients };
  });

  fastify.post('/developer/oauth/clients', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createOAuthClientSchema.parse(request.body);

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const clientId = generateSecret('cc_client_');
    const clientSecret = generateSecret('cc_client_');

    const [created] = await db
      .insert(oauthClients)
      .values({
        householdId,
        createdByMemberId: membership.id,
        name: body.name,
        clientId,
        clientSecretHash: hashValue(clientSecret),
        redirectUris: body.redirectUris,
        scopes: body.scopes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return reply.status(201).send({
      client: {
        id: created.id,
        householdId: created.householdId,
        createdByMemberId: created.createdByMemberId,
        name: created.name,
        clientId: created.clientId,
        redirectUris: created.redirectUris,
        scopes: created.scopes,
        isActive: created.isActive,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      clientSecret,
    });
  });

  fastify.get('/developer/sdk-packages', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Household membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    await seedSdkPackages();

    const sdkPackages = await db
      .select()
      .from(apiSdkPackages)
      .where(eq(apiSdkPackages.isActive, true))
      .orderBy(apiSdkPackages.language);

    return { sdkPackages };
  });

  fastify.post('/developer/sdk-packages', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = sdkPackageSchema.parse(request.body);

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const [existing] = await db
      .select()
      .from(apiSdkPackages)
      .where(eq(apiSdkPackages.language, body.language));

    if (existing) {
      const [updated] = await db
        .update(apiSdkPackages)
        .set({
          packageName: body.packageName,
          version: body.version,
          repoUrl: body.repoUrl,
          docsUrl: body.docsUrl,
          installCommand: body.installCommand,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(apiSdkPackages.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(apiSdkPackages)
      .values({
        language: body.language,
        packageName: body.packageName,
        version: body.version,
        repoUrl: body.repoUrl,
        docsUrl: body.docsUrl,
        installCommand: body.installCommand,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });

  fastify.get('/developer/analytics', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await requireParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(householdId, reply);
    if (!premiumAllowed) return;

    const usage = await computeUsageSummary(householdId);

    const perKey = await db
      .select({
        apiKeyId: apiKeyUsageEvents.apiKeyId,
        requests: sql<number>`count(*)::int`,
        failures: sql<number>`sum(case when ${apiKeyUsageEvents.statusCode} >= 400 then 1 else 0 end)::int`,
      })
      .from(apiKeyUsageEvents)
      .where(eq(apiKeyUsageEvents.householdId, householdId))
      .groupBy(apiKeyUsageEvents.apiKeyId)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    return { usage, perKey };
  });
}

export async function oauthPlatformRoutes(fastify: FastifyInstance) {
  fastify.post('/authorize', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const body = authorizeOAuthSchema.parse(request.body);

    const membership = await verifyMembership(user.id, body.householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent membership required.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(body.householdId, reply);
    if (!premiumAllowed) return;

    const [client] = await db
      .select()
      .from(oauthClients)
      .where(and(eq(oauthClients.clientId, body.clientId), eq(oauthClients.householdId, body.householdId)));

    if (!client || !client.isActive) {
      return reply.status(404).send({ error: 'Not Found', message: 'OAuth client not found.' });
    }

    if (!client.redirectUris.includes(body.redirectUri)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Redirect URI is not registered.' });
    }

    const invalidScope = body.scopes.find((scope) => !client.scopes.includes(scope));
    if (invalidScope) {
      return reply.status(400).send({ error: 'Bad Request', message: `Scope not permitted: ${invalidScope}` });
    }

    const code = generateCode(48);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(oauthAuthorizationCodes).values({
      code,
      oauthClientId: client.id,
      householdId: body.householdId,
      memberId: membership.id,
      scopes: body.scopes,
      redirectUri: body.redirectUri,
      expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    });

    return {
      code,
      expiresAt,
      redirectUri: body.redirectUri,
    };
  });

  fastify.post('/token', async (request, reply) => {
    const body = exchangeOAuthTokenSchema.parse(request.body);

    const [client] = await db.select().from(oauthClients).where(eq(oauthClients.clientId, body.clientId));

    if (!client || !client.isActive) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid OAuth client.' });
    }

    const premiumAllowed = await requirePremiumHouseholdReply(client.householdId, reply);
    if (!premiumAllowed) return;

    if (hashValue(body.clientSecret) !== client.clientSecretHash) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid OAuth credentials.' });
    }

    const [codeRecord] = await db
      .select()
      .from(oauthAuthorizationCodes)
      .where(and(eq(oauthAuthorizationCodes.code, body.code), eq(oauthAuthorizationCodes.oauthClientId, client.id)));

    if (!codeRecord) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid authorization code.' });
    }

    if (codeRecord.redirectUri !== body.redirectUri) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Redirect URI mismatch.' });
    }

    if (codeRecord.consumedAt) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Authorization code already consumed.' });
    }

    if (codeRecord.expiresAt.getTime() < Date.now()) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Authorization code expired.' });
    }

    const accessToken = generateSecret('cc_oauth_');
    const tokenHash = hashValue(accessToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(oauthAccessTokens).values({
      tokenHash,
      oauthClientId: client.id,
      householdId: codeRecord.householdId,
      memberId: codeRecord.memberId,
      scopes: codeRecord.scopes,
      expiresAt,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date(),
    });

    await db
      .update(oauthAuthorizationCodes)
      .set({ consumedAt: new Date() })
      .where(eq(oauthAuthorizationCodes.code, codeRecord.code));

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: codeRecord.scopes.join(' '),
    };
  });
}

export async function publicApiPlatformRoutes(fastify: FastifyInstance) {
  fastify.get('/openapi.json', async () => buildOpenApiDocument());

  fastify.get(
    '/households/:householdId/chores',
    { preHandler: [optionalApiKeyAuth] },
    async (request, reply) => {
      const startedAt = Date.now();
      const { householdId } = request.params as { householdId: string };
      const apiRequest = request as ApiKeyAuthenticatedRequest;

      if (apiRequest.apiKey) {
        if (apiRequest.apiKey.householdId !== householdId) {
          return reply.status(403).send({ error: 'Forbidden', message: 'API key does not match household.' });
        }

        const scopeCheck = await requirePublicScope(apiRequest, 'chores:read');
        if (!scopeCheck.allowed) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Missing scope: chores:read' });
        }

        const rateLimit = await enforceApiKeyRateLimit(apiRequest.apiKey.id);
        if (!rateLimit.allowed) {
          return reply.status(429).send({
            error: 'Too Many Requests',
            message: `Rate limit exceeded (${rateLimit.limit} requests per minute).`,
          });
        }
      } else {
        const token = extractBearerToken(request.headers as Record<string, unknown>);
        const oauth = token ? await resolveOAuthToken(token) : null;
        if (!oauth) {
          return reply.status(401).send({ error: 'Unauthorized', message: 'API key or OAuth token required.' });
        }
        if (oauth.householdId !== householdId) {
          return reply.status(403).send({ error: 'Forbidden', message: 'OAuth token does not match household.' });
        }
        if (!oauth.scopes.includes('chores:read')) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Missing scope: chores:read' });
        }
      }

      const householdChores = await db
        .select()
        .from(chores)
        .where(eq(chores.householdId, householdId))
        .orderBy(desc(chores.createdAt));

      if (apiRequest.apiKey) {
        await recordApiKeyUsage({
          apiKeyId: apiRequest.apiKey.id,
          householdId,
          requestPath: request.url,
          requestMethod: request.method,
          statusCode: 200,
          responseTimeMs: Date.now() - startedAt,
        });
      }

      return {
        data: householdChores,
        count: householdChores.length,
      };
    }
  );

  fastify.get(
    '/households/:householdId/members',
    { preHandler: [optionalApiKeyAuth] },
    async (request, reply) => {
      const startedAt = Date.now();
      const { householdId } = request.params as { householdId: string };
      const apiRequest = request as ApiKeyAuthenticatedRequest;

      if (apiRequest.apiKey) {
        if (apiRequest.apiKey.householdId !== householdId) {
          return reply.status(403).send({ error: 'Forbidden', message: 'API key does not match household.' });
        }

        const scopeCheck = await requirePublicScope(apiRequest, 'members:read');
        if (!scopeCheck.allowed) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Missing scope: members:read' });
        }

        const rateLimit = await enforceApiKeyRateLimit(apiRequest.apiKey.id);
        if (!rateLimit.allowed) {
          return reply.status(429).send({
            error: 'Too Many Requests',
            message: `Rate limit exceeded (${rateLimit.limit} requests per minute).`,
          });
        }
      } else {
        const token = extractBearerToken(request.headers as Record<string, unknown>);
        const oauth = token ? await resolveOAuthToken(token) : null;
        if (!oauth) {
          return reply.status(401).send({ error: 'Unauthorized', message: 'API key or OAuth token required.' });
        }
        if (oauth.householdId !== householdId) {
          return reply.status(403).send({ error: 'Forbidden', message: 'OAuth token does not match household.' });
        }
        if (!oauth.scopes.includes('members:read')) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Missing scope: members:read' });
        }
      }

      const householdMembers = await db
        .select({
          id: members.id,
          householdId: members.householdId,
          name: members.name,
          role: members.role,
          color: members.color,
          avatarUrl: members.avatarUrl,
          createdAt: members.createdAt,
        })
        .from(members)
        .where(eq(members.householdId, householdId))
        .orderBy(members.name);

      if (apiRequest.apiKey) {
        await recordApiKeyUsage({
          apiKeyId: apiRequest.apiKey.id,
          householdId,
          requestPath: request.url,
          requestMethod: request.method,
          statusCode: 200,
          responseTimeMs: Date.now() - startedAt,
        });
      }

      return {
        data: householdMembers,
        count: householdMembers.length,
      };
    }
  );

  fastify.post(
    '/households/:householdId/events/:eventType',
    { preHandler: [optionalApiKeyAuth] },
    async (request, reply) => {
      const startedAt = Date.now();
      const { householdId, eventType } = request.params as {
        householdId: string;
        eventType: ApiPlatformWebhookEventType;
      };
      const payload = (request.body ?? {}) as Record<string, unknown>;
      const apiRequest = request as ApiKeyAuthenticatedRequest;

      if (!webhookEventTypes.includes(eventType)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Unsupported event type.' });
      }

      if (apiRequest.apiKey) {
        if (apiRequest.apiKey.householdId !== householdId) {
          return reply.status(403).send({ error: 'Forbidden', message: 'API key does not match household.' });
        }

        const scopeCheck = await requirePublicScope(apiRequest, 'webhooks:write');
        if (!scopeCheck.allowed) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Missing scope: webhooks:write' });
        }

        const rateLimit = await enforceApiKeyRateLimit(apiRequest.apiKey.id);
        if (!rateLimit.allowed) {
          return reply.status(429).send({
            error: 'Too Many Requests',
            message: `Rate limit exceeded (${rateLimit.limit} requests per minute).`,
          });
        }
      } else {
        const token = extractBearerToken(request.headers as Record<string, unknown>);
        const oauth = token ? await resolveOAuthToken(token) : null;
        if (!oauth) {
          return reply.status(401).send({ error: 'Unauthorized', message: 'API key or OAuth token required.' });
        }
        if (oauth.householdId !== householdId) {
          return reply.status(403).send({ error: 'Forbidden', message: 'OAuth token does not match household.' });
        }
        if (!oauth.scopes.includes('webhooks:write')) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Missing scope: webhooks:write' });
        }
      }

      const dispatchedCount = await dispatchWebhookEvent({
        householdId,
        eventType,
        payload,
      });

      if (apiRequest.apiKey) {
        await recordApiKeyUsage({
          apiKeyId: apiRequest.apiKey.id,
          householdId,
          requestPath: request.url,
          requestMethod: request.method,
          statusCode: 200,
          responseTimeMs: Date.now() - startedAt,
        });
      }

      return { dispatchedCount };
    }
  );
}
