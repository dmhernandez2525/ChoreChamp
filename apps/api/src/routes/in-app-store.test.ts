import { describe, expect, it } from 'vitest';

describe('in-app store route logic', () => {
  describe('pricing', () => {
    it('applies sale discount for coin purchases', () => {
      const getDiscountedCoins = (baseCoinPrice: number, salePercent: number, quantity: number): number => {
        const saleFactor = Math.max(0, 100 - salePercent) / 100;
        return Math.floor(baseCoinPrice * saleFactor) * quantity;
      };

      expect(getDiscountedCoins(1000, 0, 1)).toBe(1000);
      expect(getDiscountedCoins(1000, 20, 1)).toBe(800);
      expect(getDiscountedCoins(1000, 20, 3)).toBe(2400);
      expect(getDiscountedCoins(750, 10, 2)).toBe(1350);
    });

    it('computes bundle grants and point costs', () => {
      const getBundlePricing = (
        basePointPrice: number,
        salePercent: number,
        coinsGrantedPerBundle: number,
        quantity: number
      ): { pointsSpent: number; coinsGranted: number } => {
        const saleFactor = Math.max(0, 100 - salePercent) / 100;
        return {
          pointsSpent: Math.floor(basePointPrice * saleFactor) * quantity,
          coinsGranted: coinsGrantedPerBundle * quantity,
        };
      };

      expect(getBundlePricing(250, 0, 1000, 1)).toEqual({ pointsSpent: 250, coinsGranted: 1000 });
      expect(getBundlePricing(1100, 10, 5000, 2)).toEqual({ pointsSpent: 1980, coinsGranted: 10000 });
    });
  });

  describe('availability checks', () => {
    it('flags items outside their availability window', () => {
      const now = new Date('2026-02-15T12:00:00Z');

      const isAvailable = (
        isActive: boolean,
        availableFrom: Date | null,
        availableUntil: Date | null,
        currentTime: Date
      ): { valid: boolean; reason?: string } => {
        if (!isActive) return { valid: false, reason: 'Item is not currently active.' };
        if (availableFrom && availableFrom > currentTime) return { valid: false, reason: 'Item is not available yet.' };
        if (availableUntil && availableUntil < currentTime) return { valid: false, reason: 'This offer has ended.' };
        return { valid: true };
      };

      expect(isAvailable(true, null, null, now)).toEqual({ valid: true });
      expect(isAvailable(false, null, null, now)).toEqual({
        valid: false,
        reason: 'Item is not currently active.',
      });
      expect(isAvailable(true, new Date('2026-02-16T00:00:00Z'), null, now)).toEqual({
        valid: false,
        reason: 'Item is not available yet.',
      });
      expect(isAvailable(true, null, new Date('2026-02-14T00:00:00Z'), now)).toEqual({
        valid: false,
        reason: 'This offer has ended.',
      });
    });
  });

  describe('parental controls', () => {
    it('requires approval when configured for child purchases', () => {
      const shouldRequireApproval = (
        requireParentApproval: boolean,
        requesterRole: 'parent' | 'child' | 'teen'
      ): boolean => {
        return requireParentApproval && requesterRole !== 'parent';
      };

      expect(shouldRequireApproval(true, 'child')).toBe(true);
      expect(shouldRequireApproval(true, 'teen')).toBe(true);
      expect(shouldRequireApproval(true, 'parent')).toBe(false);
      expect(shouldRequireApproval(false, 'child')).toBe(false);
    });

    it('enforces daily spending limits', () => {
      const canSpend = (
        alreadySpent: number,
        nextSpend: number,
        dailyLimit: number
      ): { allowed: boolean; message?: string } => {
        if (alreadySpent + nextSpend > dailyLimit) {
          return { allowed: false, message: 'Daily spending limit reached.' };
        }
        return { allowed: true };
      };

      expect(canSpend(100, 200, 500)).toEqual({ allowed: true });
      expect(canSpend(400, 150, 500)).toEqual({
        allowed: false,
        message: 'Daily spending limit reached.',
      });
    });
  });

  describe('refund handling', () => {
    it('calculates wallet reversal values', () => {
      const applyRefund = (
        currentBalance: number,
        coinsSpent: number,
        coinsGranted: number
      ): number => {
        return Math.max(0, currentBalance + coinsSpent - coinsGranted);
      };

      expect(applyRefund(2000, 800, 0)).toBe(2800);
      expect(applyRefund(500, 0, 1000)).toBe(0);
      expect(applyRefund(1800, 600, 200)).toBe(2200);
    });
  });

  describe('gift code format', () => {
    it('generates uppercase gift-code format', () => {
      const createGiftCode = (hex: string): string => `GIFT-${hex.toUpperCase()}`;

      expect(createGiftCode('abc123def456')).toBe('GIFT-ABC123DEF456');
      expect(createGiftCode('ff00aa')).toMatch(/^GIFT-[A-F0-9]+$/);
    });
  });
});

