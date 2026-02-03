import { describe, it, expect } from 'vitest';
import {
  getEffectiveTier,
  getMemberLimitForTier,
  normalizeStatus,
  mapStripeStatus,
} from './subscription';

describe('subscription helpers', () => {
  it('returns member limits per tier', () => {
    expect(getMemberLimitForTier('free')).toBe(5);
    expect(getMemberLimitForTier('family')).toBe(6);
    expect(getMemberLimitForTier('premium')).toBeNull();
  });

  it('normalizes expired grace period', () => {
    const expired = new Date(Date.now() - 1000 * 60);
    expect(normalizeStatus('grace_period', expired)).toBe('expired');
  });

  it('keeps entitled tiers active', () => {
    const activeTier = getEffectiveTier('premium', 'active', null);
    expect(activeTier).toBe('premium');
  });

  it('downgrades non-entitled status to free', () => {
    const tier = getEffectiveTier('family', 'expired', null);
    expect(tier).toBe('free');
  });

  it('maps stripe statuses', () => {
    expect(mapStripeStatus('trialing')).toBe('trialing');
    expect(mapStripeStatus('past_due')).toBe('past_due');
    expect(mapStripeStatus('canceled')).toBe('canceled');
    expect(mapStripeStatus('incomplete_expired')).toBe('expired');
  });
});
