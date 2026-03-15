import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test helpers for chores-related logic
// These tests focus on the business logic without requiring a full Fastify server

describe('chore route logic', () => {
  describe('createChoreSchema validation', () => {
    const createChoreSchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      icon: z.string().max(50).default('✅'),
      category: z.string().max(50).default('general'),
      pointValue: z.number().min(1).max(1000).default(10),
      difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic']).default('medium'),
      assignedTo: z.array(z.string().uuid()).default([]),
      assignmentType: z.enum(['specific', 'rotating', 'anyone']).default('specific'),
      recurrenceType: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']).default('once'),
      recurrenceDays: z.array(z.number().min(0).max(6)).optional(),
      recurrenceInterval: z.number().min(1).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      dueTime: z.string().optional(),
      timeWindowMinutes: z.number().min(1).optional(),
      requiresApproval: z.boolean().default(false),
      requiresPhoto: z.boolean().default(false),
      estimatedMinutes: z.number().min(1).optional(),
      showTimer: z.boolean().default(false),
      steps: z.array(z.string()).optional(),
    });

    it('accepts minimal valid input with defaults', () => {
      const result = createChoreSchema.safeParse({ title: 'Clean room' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Clean room');
        expect(result.data.icon).toBe('✅');
        expect(result.data.category).toBe('general');
        expect(result.data.pointValue).toBe(10);
        expect(result.data.difficulty).toBe('medium');
        expect(result.data.assignedTo).toEqual([]);
        expect(result.data.assignmentType).toBe('specific');
        expect(result.data.recurrenceType).toBe('once');
        expect(result.data.requiresApproval).toBe(false);
        expect(result.data.requiresPhoto).toBe(false);
        expect(result.data.showTimer).toBe(false);
      }
    });

    it('accepts fully specified chore', () => {
      const result = createChoreSchema.safeParse({
        title: 'Do the dishes',
        description: 'Wash all dishes in the sink',
        icon: '🍽️',
        category: 'kitchen',
        pointValue: 25,
        difficulty: 'hard',
        assignedTo: ['550e8400-e29b-41d4-a716-446655440000'],
        assignmentType: 'specific',
        recurrenceType: 'daily',
        recurrenceDays: [1, 2, 3, 4, 5],
        recurrenceInterval: 1,
        startDate: '2024-06-01',
        endDate: '2024-12-31',
        dueTime: '18:00',
        timeWindowMinutes: 60,
        requiresApproval: true,
        requiresPhoto: true,
        estimatedMinutes: 30,
        showTimer: true,
        steps: ['Scrape plates', 'Load dishwasher', 'Wipe counters'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createChoreSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing title', () => {
      const result = createChoreSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects title exceeding 200 characters', () => {
      const result = createChoreSchema.safeParse({ title: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('accepts title at max length (200 chars)', () => {
      const result = createChoreSchema.safeParse({ title: 'a'.repeat(200) });
      expect(result.success).toBe(true);
    });

    it('validates pointValue boundaries', () => {
      expect(createChoreSchema.safeParse({ title: 'T', pointValue: 1 }).success).toBe(true);
      expect(createChoreSchema.safeParse({ title: 'T', pointValue: 1000 }).success).toBe(true);
      expect(createChoreSchema.safeParse({ title: 'T', pointValue: 0 }).success).toBe(false);
      expect(createChoreSchema.safeParse({ title: 'T', pointValue: 1001 }).success).toBe(false);
      expect(createChoreSchema.safeParse({ title: 'T', pointValue: -5 }).success).toBe(false);
    });

    it('validates all difficulty levels', () => {
      const levels = ['trivial', 'easy', 'medium', 'hard', 'epic'] as const;
      for (const difficulty of levels) {
        expect(createChoreSchema.safeParse({ title: 'T', difficulty }).success).toBe(true);
      }
    });

    it('rejects invalid difficulty', () => {
      expect(createChoreSchema.safeParse({ title: 'T', difficulty: 'legendary' }).success).toBe(false);
      expect(createChoreSchema.safeParse({ title: 'T', difficulty: '' }).success).toBe(false);
    });

    it('validates assignedTo array contains UUIDs', () => {
      expect(createChoreSchema.safeParse({
        title: 'T',
        assignedTo: ['550e8400-e29b-41d4-a716-446655440000'],
      }).success).toBe(true);

      expect(createChoreSchema.safeParse({
        title: 'T',
        assignedTo: ['not-a-uuid'],
      }).success).toBe(false);

      expect(createChoreSchema.safeParse({
        title: 'T',
        assignedTo: [],
      }).success).toBe(true);
    });

    it('validates all assignment types', () => {
      for (const type of ['specific', 'rotating', 'anyone']) {
        expect(createChoreSchema.safeParse({ title: 'T', assignmentType: type }).success).toBe(true);
      }
      expect(createChoreSchema.safeParse({ title: 'T', assignmentType: 'random' }).success).toBe(false);
    });

    it('validates all recurrence types', () => {
      for (const type of ['once', 'daily', 'weekly', 'monthly', 'custom']) {
        expect(createChoreSchema.safeParse({ title: 'T', recurrenceType: type }).success).toBe(true);
      }
      expect(createChoreSchema.safeParse({ title: 'T', recurrenceType: 'yearly' }).success).toBe(false);
    });

    it('validates recurrenceDays are within 0-6 range', () => {
      expect(createChoreSchema.safeParse({ title: 'T', recurrenceDays: [0, 1, 6] }).success).toBe(true);
      expect(createChoreSchema.safeParse({ title: 'T', recurrenceDays: [7] }).success).toBe(false);
      expect(createChoreSchema.safeParse({ title: 'T', recurrenceDays: [-1] }).success).toBe(false);
    });

    it('validates recurrenceInterval minimum', () => {
      expect(createChoreSchema.safeParse({ title: 'T', recurrenceInterval: 1 }).success).toBe(true);
      expect(createChoreSchema.safeParse({ title: 'T', recurrenceInterval: 0 }).success).toBe(false);
    });

    it('validates timeWindowMinutes minimum', () => {
      expect(createChoreSchema.safeParse({ title: 'T', timeWindowMinutes: 1 }).success).toBe(true);
      expect(createChoreSchema.safeParse({ title: 'T', timeWindowMinutes: 0 }).success).toBe(false);
    });

    it('validates estimatedMinutes minimum', () => {
      expect(createChoreSchema.safeParse({ title: 'T', estimatedMinutes: 1 }).success).toBe(true);
      expect(createChoreSchema.safeParse({ title: 'T', estimatedMinutes: 0 }).success).toBe(false);
    });

    it('accepts steps as string array', () => {
      expect(createChoreSchema.safeParse({
        title: 'T',
        steps: ['Step 1', 'Step 2', 'Step 3'],
      }).success).toBe(true);
    });

    it('rejects icon exceeding 50 characters', () => {
      expect(createChoreSchema.safeParse({ title: 'T', icon: 'a'.repeat(51) }).success).toBe(false);
    });

    it('rejects category exceeding 50 characters', () => {
      expect(createChoreSchema.safeParse({ title: 'T', category: 'a'.repeat(51) }).success).toBe(false);
    });
  });

  describe('updateChoreSchema validation', () => {
    const createChoreSchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      icon: z.string().max(50).default('✅'),
      category: z.string().max(50).default('general'),
      pointValue: z.number().min(1).max(1000).default(10),
      difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic']).default('medium'),
      assignedTo: z.array(z.string().uuid()).default([]),
      assignmentType: z.enum(['specific', 'rotating', 'anyone']).default('specific'),
      recurrenceType: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']).default('once'),
      recurrenceDays: z.array(z.number().min(0).max(6)).optional(),
      recurrenceInterval: z.number().min(1).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      dueTime: z.string().optional(),
      timeWindowMinutes: z.number().min(1).optional(),
      requiresApproval: z.boolean().default(false),
      requiresPhoto: z.boolean().default(false),
      estimatedMinutes: z.number().min(1).optional(),
      showTimer: z.boolean().default(false),
      steps: z.array(z.string()).optional(),
    });

    const updateChoreSchema = createChoreSchema.partial().extend({
      isActive: z.boolean().optional(),
    });

    it('accepts empty update body', () => {
      const result = updateChoreSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts partial field updates', () => {
      const result = updateChoreSchema.safeParse({ title: 'Updated Title' });
      expect(result.success).toBe(true);
    });

    it('accepts isActive toggle (soft delete)', () => {
      expect(updateChoreSchema.safeParse({ isActive: false }).success).toBe(true);
      expect(updateChoreSchema.safeParse({ isActive: true }).success).toBe(true);
    });

    it('validates partial fields the same as create schema', () => {
      // Invalid values still rejected even in partial mode
      expect(updateChoreSchema.safeParse({ title: '' }).success).toBe(false);
      expect(updateChoreSchema.safeParse({ pointValue: 0 }).success).toBe(false);
      expect(updateChoreSchema.safeParse({ difficulty: 'invalid' }).success).toBe(false);
    });
  });

  describe('listChoresQuerySchema validation', () => {
    const listChoresQuerySchema = z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      assignedTo: z.string().uuid().optional(),
      difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic']).optional(),
      sortBy: z.enum(['title', 'priority', 'boardOrder', 'createdAt', 'dueTime', 'pointValue']).default('boardOrder'),
      sortDir: z.enum(['asc', 'desc']).default('asc'),
      limit: z.coerce.number().min(1).max(200).default(100),
      offset: z.coerce.number().min(0).default(0),
    });

    it('accepts empty query with defaults', () => {
      const result = listChoresQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe('boardOrder');
        expect(result.data.sortDir).toBe('asc');
        expect(result.data.limit).toBe(100);
        expect(result.data.offset).toBe(0);
      }
    });

    it('accepts all valid sort columns', () => {
      const columns = ['title', 'priority', 'boardOrder', 'createdAt', 'dueTime', 'pointValue'] as const;
      for (const sortBy of columns) {
        expect(listChoresQuerySchema.safeParse({ sortBy }).success).toBe(true);
      }
    });

    it('rejects invalid sort column', () => {
      expect(listChoresQuerySchema.safeParse({ sortBy: 'invalidColumn' }).success).toBe(false);
    });

    it('validates priority filter', () => {
      for (const priority of ['low', 'medium', 'high', 'urgent']) {
        expect(listChoresQuerySchema.safeParse({ priority }).success).toBe(true);
      }
      expect(listChoresQuerySchema.safeParse({ priority: 'critical' }).success).toBe(false);
    });

    it('validates assignedTo is a UUID', () => {
      expect(listChoresQuerySchema.safeParse({
        assignedTo: '550e8400-e29b-41d4-a716-446655440000',
      }).success).toBe(true);
      expect(listChoresQuerySchema.safeParse({
        assignedTo: 'not-a-uuid',
      }).success).toBe(false);
    });

    it('coerces string limit and offset to numbers', () => {
      const result = listChoresQuerySchema.safeParse({ limit: '50', offset: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(10);
      }
    });

    it('validates limit boundaries', () => {
      expect(listChoresQuerySchema.safeParse({ limit: 1 }).success).toBe(true);
      expect(listChoresQuerySchema.safeParse({ limit: 200 }).success).toBe(true);
      expect(listChoresQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
      expect(listChoresQuerySchema.safeParse({ limit: 201 }).success).toBe(false);
    });

    it('validates offset minimum', () => {
      expect(listChoresQuerySchema.safeParse({ offset: 0 }).success).toBe(true);
      expect(listChoresQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
    });
  });

  describe('completeChoreSchema validation', () => {
    const completeChoreSchema = z.object({
      scheduledDate: z.string(),
      photoUrl: z.string().url().optional(),
      startedAt: z.string().optional(),
      durationSeconds: z.number().min(0).optional(),
    });

    it('accepts minimal completion data', () => {
      const result = completeChoreSchema.safeParse({ scheduledDate: '2024-06-15' });
      expect(result.success).toBe(true);
    });

    it('accepts full completion data', () => {
      const result = completeChoreSchema.safeParse({
        scheduledDate: '2024-06-15',
        photoUrl: 'https://example.com/photo.jpg',
        startedAt: '2024-06-15T10:00:00Z',
        durationSeconds: 300,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing scheduledDate', () => {
      const result = completeChoreSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('validates photoUrl is a proper URL', () => {
      expect(completeChoreSchema.safeParse({
        scheduledDate: '2024-06-15',
        photoUrl: 'not-a-url',
      }).success).toBe(false);
    });

    it('validates durationSeconds is non-negative', () => {
      expect(completeChoreSchema.safeParse({
        scheduledDate: '2024-06-15',
        durationSeconds: 0,
      }).success).toBe(true);
      expect(completeChoreSchema.safeParse({
        scheduledDate: '2024-06-15',
        durationSeconds: -1,
      }).success).toBe(false);
    });
  });

  describe('difficulty mapping', () => {
    it('maps chore difficulties to gamification difficulties', () => {
      type Difficulty = 'easy' | 'medium' | 'hard';

      const mapDifficulty = (choreDifficulty: string | null): Difficulty => {
        const map: Record<string, Difficulty> = {
          'trivial': 'easy',
          'easy': 'easy',
          'medium': 'medium',
          'hard': 'hard',
          'epic': 'hard',
        };
        return map[choreDifficulty || 'medium'] || 'medium';
      };

      expect(mapDifficulty('trivial')).toBe('easy');
      expect(mapDifficulty('easy')).toBe('easy');
      expect(mapDifficulty('medium')).toBe('medium');
      expect(mapDifficulty('hard')).toBe('hard');
      expect(mapDifficulty('epic')).toBe('hard');
      expect(mapDifficulty(null)).toBe('medium');
      expect(mapDifficulty('unknown')).toBe('medium');
    });
  });

  describe('completion status determination', () => {
    it('determines initial status based on approval requirement', () => {
      const getInitialStatus = (requiresApproval: boolean): 'pending' | 'approved' => {
        return requiresApproval ? 'pending' : 'approved';
      };

      expect(getInitialStatus(true)).toBe('pending');
      expect(getInitialStatus(false)).toBe('approved');
    });

    it('calculates points awarded based on status', () => {
      const getPointsAwarded = (status: string, totalPoints: number): number => {
        return status === 'approved' ? totalPoints : 0;
      };

      expect(getPointsAwarded('approved', 50)).toBe(50);
      expect(getPointsAwarded('pending', 50)).toBe(0);
      expect(getPointsAwarded('rejected', 50)).toBe(0);
    });
  });

  describe('photo requirement validation', () => {
    it('validates photo is provided when required', () => {
      const validatePhoto = (
        requiresPhoto: boolean,
        photoUrl: string | undefined
      ): { valid: boolean; error?: string } => {
        if (requiresPhoto && !photoUrl) {
          return { valid: false, error: 'Photo is required for this chore' };
        }
        return { valid: true };
      };

      expect(validatePhoto(true, 'https://example.com/photo.jpg')).toEqual({ valid: true });
      expect(validatePhoto(true, undefined)).toEqual({
        valid: false,
        error: 'Photo is required for this chore',
      });
      expect(validatePhoto(false, undefined)).toEqual({ valid: true });
      expect(validatePhoto(false, 'https://example.com/photo.jpg')).toEqual({ valid: true });
    });
  });

  describe('streak calculation', () => {
    it('increments streak when last completion was yesterday', () => {
      const calculateNewStreak = (
        currentStreak: number,
        lastCompletedDate: string | null,
        today: string,
        yesterday: string
      ): number => {
        if (lastCompletedDate === yesterday || lastCompletedDate === today) {
          return currentStreak + 1;
        }
        return 1; // Reset streak
      };

      expect(calculateNewStreak(5, '2024-06-14', '2024-06-15', '2024-06-14')).toBe(6);
      expect(calculateNewStreak(5, '2024-06-15', '2024-06-15', '2024-06-14')).toBe(6);
      expect(calculateNewStreak(5, '2024-06-10', '2024-06-15', '2024-06-14')).toBe(1);
      expect(calculateNewStreak(5, null, '2024-06-15', '2024-06-14')).toBe(1);
    });

    it('updates longest streak correctly', () => {
      const getNewLongestStreak = (currentLongest: number, newStreak: number): number => {
        return Math.max(currentLongest, newStreak);
      };

      expect(getNewLongestStreak(10, 5)).toBe(10);
      expect(getNewLongestStreak(10, 11)).toBe(11);
      expect(getNewLongestStreak(0, 1)).toBe(1);
    });
  });

  describe('permission checks', () => {
    it('validates parent-only chore creation', () => {
      const canCreateChore = (role: string): boolean => role === 'parent';

      expect(canCreateChore('parent')).toBe(true);
      expect(canCreateChore('child')).toBe(false);
      expect(canCreateChore('teen')).toBe(false);
      expect(canCreateChore('viewer')).toBe(false);
    });

    it('validates parent-only chore update', () => {
      const canUpdateChore = (role: string): boolean => role === 'parent';

      expect(canUpdateChore('parent')).toBe(true);
      expect(canUpdateChore('child')).toBe(false);
    });

    it('validates parent-only chore deletion', () => {
      const canDeleteChore = (role: string): boolean => role === 'parent';

      expect(canDeleteChore('parent')).toBe(true);
      expect(canDeleteChore('child')).toBe(false);
    });

    it('validates parent-only completion approval', () => {
      const canApproveCompletion = (role: string): boolean => role === 'parent';

      expect(canApproveCompletion('parent')).toBe(true);
      expect(canApproveCompletion('child')).toBe(false);
      expect(canApproveCompletion('teen')).toBe(false);
    });

    it('validates parent-only completion rejection', () => {
      const canRejectCompletion = (role: string): boolean => role === 'parent';

      expect(canRejectCompletion('parent')).toBe(true);
      expect(canRejectCompletion('child')).toBe(false);
    });

    it('validates parent-only pending completions view', () => {
      const canViewPendingCompletions = (role: string): boolean => role === 'parent';

      expect(canViewPendingCompletions('parent')).toBe(true);
      expect(canViewPendingCompletions('child')).toBe(false);
    });
  });

  describe('soft delete behavior', () => {
    it('sets isActive to false instead of deleting', () => {
      const softDelete = (_chore: { isActive: boolean }): { isActive: boolean; updatedAt: Date } => {
        return {
          isActive: false,
          updatedAt: new Date(),
        };
      };

      const result = softDelete({ isActive: true });
      expect(result.isActive).toBe(false);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('start date defaulting', () => {
    it('defaults startDate to today when not provided', () => {
      const getStartDate = (providedStartDate: string | undefined): string => {
        return providedStartDate || new Date().toISOString().split('T')[0];
      };

      const today = new Date().toISOString().split('T')[0];
      expect(getStartDate(undefined)).toBe(today);
      expect(getStartDate('2024-01-01')).toBe('2024-01-01');
    });
  });
});
