import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('stripe lib', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('requireStripe', () => {
    it('throws an error when STRIPE_SECRET_KEY is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const { requireStripe } = await import('./stripe');
      expect(() => requireStripe()).toThrow('Stripe is not configured');
    });

    it('returns Stripe instance when STRIPE_SECRET_KEY is configured', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
      const { requireStripe } = await import('./stripe');
      const stripe = requireStripe();
      expect(stripe).toBeDefined();
      expect(typeof stripe.checkout).toBe('object');
    });
  });

  describe('getStripeWebhookSecret', () => {
    it('throws an error when STRIPE_WEBHOOK_SECRET is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const { getStripeWebhookSecret } = await import('./stripe');
      expect(() => getStripeWebhookSecret()).toThrow('STRIPE_WEBHOOK_SECRET is not configured');
    });

    it('returns webhook secret when STRIPE_WEBHOOK_SECRET is configured', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_12345';
      const { getStripeWebhookSecret } = await import('./stripe');
      const secret = getStripeWebhookSecret();
      expect(secret).toBe('whsec_test_12345');
    });
  });

  describe('stripe export', () => {
    it('exports null when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const { stripe } = await import('./stripe');
      expect(stripe).toBeNull();
    });

    it('exports Stripe instance when STRIPE_SECRET_KEY is set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_configured';
      const { stripe } = await import('./stripe');
      expect(stripe).toBeDefined();
      expect(stripe).not.toBeNull();
    });
  });
});
