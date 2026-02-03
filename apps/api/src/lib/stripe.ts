import Stripe from 'stripe';
import { createLogger } from './logger';

const logger = createLogger('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return stripe;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('Stripe webhook secret is not configured');
  }
  return secret || '';
}
