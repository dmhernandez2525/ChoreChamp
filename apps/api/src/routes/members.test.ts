import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test helpers for members-related logic
// These tests focus on the business logic without requiring a full Fastify server

describe('member route logic', () => {
  describe('createMemberSchema validation', () => {
    const createMemberSchema = z.object({
      name: z.string().min(1).max(100),
      role: z.enum(['parent', 'child', 'teen', 'viewer']),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      avatarUrl: z.string().url().optional(),
      birthYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
      canRedeemRewards: z.boolean().default(true),
      requiresApproval: z.boolean().default(true),
    });

    it('accepts valid member creation input', () => {
      const result = createMemberSchema.safeParse({
        name: 'Alice',
        role: 'child',
        color: '#FF5733',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.role).toBe('child');
        expect(result.data.color).toBe('#FF5733');
        expect(result.data.canRedeemRewards).toBe(true);
        expect(result.data.requiresApproval).toBe(true);
      }
    });

    it('accepts all optional fields', () => {
      const result = createMemberSchema.safeParse({
        name: 'Bob',
        role: 'parent',
        color: '#3B82F6',
        avatarUrl: 'https://example.com/avatar.png',
        birthYear: 1990,
        canRedeemRewards: false,
        requiresApproval: false,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createMemberSchema.safeParse({
        name: '',
        role: 'child',
        color: '#FF5733',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = createMemberSchema.safeParse({
        role: 'child',
        color: '#FF5733',
      });
      expect(result.success).toBe(false);
    });

    it('rejects name exceeding 100 characters', () => {
      const result = createMemberSchema.safeParse({
        name: 'a'.repeat(101),
        role: 'child',
        color: '#FF5733',
      });
      expect(result.success).toBe(false);
    });

    it('accepts all valid roles', () => {
      const roles = ['parent', 'child', 'teen', 'viewer'] as const;
      for (const role of roles) {
        const result = createMemberSchema.safeParse({
          name: 'Test',
          role,
          color: '#000000',
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid role', () => {
      const result = createMemberSchema.safeParse({
        name: 'Test',
        role: 'admin',
        color: '#000000',
      });
      expect(result.success).toBe(false);
    });

    it('rejects caregiver role (not in this schema)', () => {
      const result = createMemberSchema.safeParse({
        name: 'Test',
        role: 'caregiver',
        color: '#000000',
      });
      expect(result.success).toBe(false);
    });

    it('validates hex color format', () => {
      // Valid colors
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '#000000' }).success).toBe(true);
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '#FFFFFF' }).success).toBe(true);
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '#aabbcc' }).success).toBe(true);
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '#AbCdEf' }).success).toBe(true);

      // Invalid colors
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '000000' }).success).toBe(false);
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '#GGG000' }).success).toBe(false);
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '#FFF' }).success).toBe(false);
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: 'red' }).success).toBe(false);
      expect(createMemberSchema.safeParse({ name: 'T', role: 'child', color: '#1234567' }).success).toBe(false);
    });

    it('validates avatarUrl is a proper URL', () => {
      expect(createMemberSchema.safeParse({
        name: 'T', role: 'child', color: '#000000',
        avatarUrl: 'https://example.com/img.png',
      }).success).toBe(true);
      expect(createMemberSchema.safeParse({
        name: 'T', role: 'child', color: '#000000',
        avatarUrl: 'not-a-url',
      }).success).toBe(false);
    });

    it('validates birthYear range', () => {
      const currentYear = new Date().getFullYear();
      expect(createMemberSchema.safeParse({
        name: 'T', role: 'child', color: '#000000', birthYear: 2010,
      }).success).toBe(true);
      expect(createMemberSchema.safeParse({
        name: 'T', role: 'child', color: '#000000', birthYear: currentYear,
      }).success).toBe(true);
      expect(createMemberSchema.safeParse({
        name: 'T', role: 'child', color: '#000000', birthYear: 1899,
      }).success).toBe(false);
      expect(createMemberSchema.safeParse({
        name: 'T', role: 'child', color: '#000000', birthYear: currentYear + 1,
      }).success).toBe(false);
    });
  });

  describe('updateMemberSchema validation', () => {
    const updateMemberSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      role: z.enum(['parent', 'child', 'teen', 'viewer']).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      avatarUrl: z.string().url().nullable().optional(),
      birthYear: z.number().min(1900).max(new Date().getFullYear()).nullable().optional(),
      canRedeemRewards: z.boolean().optional(),
      requiresApproval: z.boolean().optional(),
      isActive: z.boolean().optional(),
    });

    it('accepts empty update body', () => {
      const result = updateMemberSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts partial updates', () => {
      const result = updateMemberSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('allows nullable avatarUrl', () => {
      expect(updateMemberSchema.safeParse({ avatarUrl: null }).success).toBe(true);
      expect(updateMemberSchema.safeParse({ avatarUrl: 'https://x.com/a.png' }).success).toBe(true);
    });

    it('allows nullable birthYear', () => {
      expect(updateMemberSchema.safeParse({ birthYear: null }).success).toBe(true);
      expect(updateMemberSchema.safeParse({ birthYear: 2000 }).success).toBe(true);
    });

    it('accepts isActive toggle', () => {
      expect(updateMemberSchema.safeParse({ isActive: false }).success).toBe(true);
      expect(updateMemberSchema.safeParse({ isActive: true }).success).toBe(true);
    });
  });

  describe('permission checks', () => {
    it('validates parent-only actions', () => {
      const canPerformParentAction = (role: string): boolean => {
        return role === 'parent';
      };

      expect(canPerformParentAction('parent')).toBe(true);
      expect(canPerformParentAction('child')).toBe(false);
      expect(canPerformParentAction('teen')).toBe(false);
      expect(canPerformParentAction('viewer')).toBe(false);
    });

    it('validates self-edit or parent privilege for member updates', () => {
      const canEditMember = (
        requestingMember: { id: string; role: string; userId: string },
        targetMember: { id: string; userId: string | null },
        fieldsBeingChanged: { role?: string; canRedeemRewards?: boolean; requiresApproval?: boolean }
      ): { allowed: boolean; error?: string } => {
        const isSelf = targetMember.userId === requestingMember.userId;
        const isParent = requestingMember.role === 'parent';

        // Permission fields require parent role
        const changesPermissions = fieldsBeingChanged.role !== undefined ||
          fieldsBeingChanged.canRedeemRewards !== undefined ||
          fieldsBeingChanged.requiresApproval !== undefined;

        if (changesPermissions && !isParent) {
          return { allowed: false, error: 'Only parents can change roles and permissions' };
        }

        if (!isParent && !isSelf) {
          return { allowed: false, error: 'You can only edit your own profile' };
        }

        return { allowed: true };
      };

      // Parent editing child
      expect(canEditMember(
        { id: 'm1', role: 'parent', userId: 'u1' },
        { id: 'm2', userId: 'u2' },
        { name: 'New Name' } as any,
      )).toEqual({ allowed: true });

      // Parent changing child role
      expect(canEditMember(
        { id: 'm1', role: 'parent', userId: 'u1' },
        { id: 'm2', userId: 'u2' },
        { role: 'teen' },
      )).toEqual({ allowed: true });

      // Child editing self (non-permission field)
      expect(canEditMember(
        { id: 'm2', role: 'child', userId: 'u2' },
        { id: 'm2', userId: 'u2' },
        {} as any,
      )).toEqual({ allowed: true });

      // Child trying to change their own role
      expect(canEditMember(
        { id: 'm2', role: 'child', userId: 'u2' },
        { id: 'm2', userId: 'u2' },
        { role: 'parent' },
      )).toEqual({ allowed: false, error: 'Only parents can change roles and permissions' });

      // Child trying to edit another child
      expect(canEditMember(
        { id: 'm2', role: 'child', userId: 'u2' },
        { id: 'm3', userId: 'u3' },
        {} as any,
      )).toEqual({ allowed: false, error: 'You can only edit your own profile' });

      // Child trying to change canRedeemRewards
      expect(canEditMember(
        { id: 'm2', role: 'child', userId: 'u2' },
        { id: 'm2', userId: 'u2' },
        { canRedeemRewards: true },
      )).toEqual({ allowed: false, error: 'Only parents can change roles and permissions' });
    });

    it('prevents self-deletion', () => {
      const canDeleteMember = (
        requestingUserId: string,
        targetMemberUserId: string | null
      ): { allowed: boolean; error?: string } => {
        if (targetMemberUserId === requestingUserId) {
          return { allowed: false, error: 'Cannot remove yourself from the household' };
        }
        return { allowed: true };
      };

      expect(canDeleteMember('u1', 'u1')).toEqual({
        allowed: false,
        error: 'Cannot remove yourself from the household',
      });
      expect(canDeleteMember('u1', 'u2')).toEqual({ allowed: true });
      expect(canDeleteMember('u1', null)).toEqual({ allowed: true });
    });
  });

  describe('bonus points logic', () => {
    it('validates amount is a number', () => {
      const validateAmount = (amount: unknown): { valid: boolean; error?: string } => {
        if (!amount || typeof amount !== 'number') {
          return { valid: false, error: 'Amount is required and must be a number' };
        }
        return { valid: true };
      };

      expect(validateAmount(10)).toEqual({ valid: true });
      expect(validateAmount(-5)).toEqual({ valid: true });
      expect(validateAmount(0)).toEqual({ valid: false, error: 'Amount is required and must be a number' });
      expect(validateAmount(null)).toEqual({ valid: false, error: 'Amount is required and must be a number' });
      expect(validateAmount(undefined)).toEqual({ valid: false, error: 'Amount is required and must be a number' });
      expect(validateAmount('10')).toEqual({ valid: false, error: 'Amount is required and must be a number' });
    });

    it('calculates new point balances after bonus', () => {
      const calculateBonusPoints = (
        currentPoints: number,
        lifetimePoints: number,
        bonusAmount: number
      ): { pointsCurrent: number; pointsLifetime: number } => {
        return {
          pointsCurrent: currentPoints + bonusAmount,
          pointsLifetime: lifetimePoints + Math.max(0, bonusAmount),
        };
      };

      // Positive bonus
      expect(calculateBonusPoints(50, 100, 25)).toEqual({
        pointsCurrent: 75,
        pointsLifetime: 125,
      });

      // Negative bonus (penalty)
      expect(calculateBonusPoints(50, 100, -10)).toEqual({
        pointsCurrent: 40,
        pointsLifetime: 100, // Lifetime never decreases
      });

      // Zero initial points
      expect(calculateBonusPoints(0, 0, 50)).toEqual({
        pointsCurrent: 50,
        pointsLifetime: 50,
      });
    });

    it('generates correct transaction description', () => {
      const getDescription = (reason: string | undefined): string => {
        return reason || 'Bonus points awarded';
      };

      expect(getDescription('Great behavior')).toBe('Great behavior');
      expect(getDescription(undefined)).toBe('Bonus points awarded');
      expect(getDescription('')).toBe('Bonus points awarded');
    });
  });

  describe('streak freeze logic', () => {
    it('validates freeze availability', () => {
      const canUseFreeze = (
        freezesAvailable: number
      ): { allowed: boolean; error?: string } => {
        if (freezesAvailable <= 0) {
          return { allowed: false, error: 'No streak freezes available' };
        }
        return { allowed: true };
      };

      expect(canUseFreeze(3)).toEqual({ allowed: true });
      expect(canUseFreeze(1)).toEqual({ allowed: true });
      expect(canUseFreeze(0)).toEqual({ allowed: false, error: 'No streak freezes available' });
    });

    it('calculates new freeze counts after usage', () => {
      const calculateFreezeUsage = (
        available: number,
        used: number
      ): { freezesAvailable: number; freezesUsed: number } => {
        return {
          freezesAvailable: available - 1,
          freezesUsed: used + 1,
        };
      };

      expect(calculateFreezeUsage(3, 0)).toEqual({ freezesAvailable: 2, freezesUsed: 1 });
      expect(calculateFreezeUsage(1, 5)).toEqual({ freezesAvailable: 0, freezesUsed: 6 });
    });

    it('validates self or parent can use streak freeze', () => {
      const canUseStreakFreeze = (
        requestingMember: { id: string; role: string; userId: string },
        targetMember: { userId: string | null }
      ): { allowed: boolean; error?: string } => {
        const isSelf = targetMember.userId === requestingMember.userId;
        const isParent = requestingMember.role === 'parent';

        if (!isSelf && !isParent) {
          return { allowed: false, error: 'You can only use streak freezes for yourself or your children' };
        }
        return { allowed: true };
      };

      // Self usage
      expect(canUseStreakFreeze(
        { id: 'm1', role: 'child', userId: 'u1' },
        { userId: 'u1' },
      )).toEqual({ allowed: true });

      // Parent for child
      expect(canUseStreakFreeze(
        { id: 'm1', role: 'parent', userId: 'u1' },
        { userId: 'u2' },
      )).toEqual({ allowed: true });

      // Child for another child
      expect(canUseStreakFreeze(
        { id: 'm1', role: 'child', userId: 'u1' },
        { userId: 'u2' },
      )).toEqual({
        allowed: false,
        error: 'You can only use streak freezes for yourself or your children',
      });
    });
  });

  describe('member limit enforcement', () => {
    it('generates appropriate limit error message', () => {
      const getLimitError = (limit: number): string => {
        return `Your plan allows up to ${limit} family members.`;
      };

      expect(getLimitError(4)).toBe('Your plan allows up to 4 family members.');
      expect(getLimitError(10)).toBe('Your plan allows up to 10 family members.');
    });
  });

  describe('null handling for member stats', () => {
    it('handles null values in point calculations', () => {
      const safePointsCurrent = (val: number | null): number => val || 0;
      const safePointsLifetime = (val: number | null): number => val || 0;

      expect(safePointsCurrent(null)).toBe(0);
      expect(safePointsCurrent(0)).toBe(0);
      expect(safePointsCurrent(50)).toBe(50);
      expect(safePointsLifetime(null)).toBe(0);
      expect(safePointsLifetime(100)).toBe(100);
    });

    it('handles null values in streak calculations', () => {
      const safeStreak = (val: number | null): number => val || 0;

      expect(safeStreak(null)).toBe(0);
      expect(safeStreak(0)).toBe(0);
      expect(safeStreak(7)).toBe(7);
    });
  });
});
