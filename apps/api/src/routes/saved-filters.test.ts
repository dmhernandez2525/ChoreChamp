import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const choreFilterSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'equals', 'not_equals', 'contains', 'starts_with',
    'in', 'not_in', 'gt', 'lt', 'gte', 'lte', 'between',
    'is_true', 'is_false', 'before', 'after',
    'is_overdue', 'is_today', 'is_this_week',
  ]),
  value: z.unknown(),
});

const createSavedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.array(choreFilterSchema).min(1),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  groupBy: z.string().optional(),
  visibility: z.enum(['private', 'household']).default('private'),
});

const updateSavedFilterSchema = createSavedFilterSchema.partial();

describe('saved-filters route logic', () => {
  describe('choreFilterSchema validation', () => {
    it('accepts valid filter with equals operator', () => {
      const result = choreFilterSchema.safeParse({
        field: 'status',
        operator: 'equals',
        value: 'completed',
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with no value for boolean-like operators', () => {
      const result = choreFilterSchema.safeParse({
        field: 'dueDate',
        operator: 'is_overdue',
        value: null,
      });
      expect(result.success).toBe(true);
    });

    it('accepts all valid operators', () => {
      const operators = [
        'equals', 'not_equals', 'contains', 'starts_with',
        'in', 'not_in', 'gt', 'lt', 'gte', 'lte', 'between',
        'is_true', 'is_false', 'before', 'after',
        'is_overdue', 'is_today', 'is_this_week',
      ];
      for (const operator of operators) {
        const result = choreFilterSchema.safeParse({
          field: 'test',
          operator,
          value: 'test',
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid operator', () => {
      const result = choreFilterSchema.safeParse({
        field: 'status',
        operator: 'matches',
        value: 'test',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing field', () => {
      const result = choreFilterSchema.safeParse({
        operator: 'equals',
        value: 'test',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createSavedFilterSchema validation', () => {
    it('accepts valid saved filter with one filter rule', () => {
      const result = createSavedFilterSchema.safeParse({
        name: 'Overdue chores',
        filters: [{ field: 'dueDate', operator: 'is_overdue', value: true }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe('private');
      }
    });

    it('accepts saved filter with sort and groupBy', () => {
      const result = createSavedFilterSchema.safeParse({
        name: 'By priority',
        filters: [{ field: 'priority', operator: 'equals', value: 'high' }],
        sort: { field: 'dueDate', direction: 'asc' },
        groupBy: 'category',
        visibility: 'household',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createSavedFilterSchema.safeParse({
        name: '',
        filters: [{ field: 'status', operator: 'equals', value: 'done' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects name exceeding 100 characters', () => {
      const result = createSavedFilterSchema.safeParse({
        name: 'x'.repeat(101),
        filters: [{ field: 'status', operator: 'equals', value: 'done' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty filters array', () => {
      const result = createSavedFilterSchema.safeParse({
        name: 'Empty filter',
        filters: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid sort direction', () => {
      const result = createSavedFilterSchema.safeParse({
        name: 'Test',
        filters: [{ field: 'status', operator: 'equals', value: 'done' }],
        sort: { field: 'dueDate', direction: 'random' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid visibility value', () => {
      const result = createSavedFilterSchema.safeParse({
        name: 'Test',
        filters: [{ field: 'status', operator: 'equals', value: 'done' }],
        visibility: 'public',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSavedFilterSchema validation', () => {
    it('accepts partial update with only name', () => {
      const result = updateSavedFilterSchema.safeParse({ name: 'New name' });
      expect(result.success).toBe(true);
    });

    it('accepts empty update object', () => {
      const result = updateSavedFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('validates constraints on provided partial fields', () => {
      const result = updateSavedFilterSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('accepts partial update changing only visibility', () => {
      const result = updateSavedFilterSchema.safeParse({ visibility: 'household' });
      expect(result.success).toBe(true);
    });
  });

  describe('filter visibility logic', () => {
    it('determines if filter is visible to household', () => {
      const isHouseholdVisible = (visibility: string): boolean => {
        return visibility === 'household';
      };

      expect(isHouseholdVisible('household')).toBe(true);
      expect(isHouseholdVisible('private')).toBe(false);
    });

    it('determines filter ownership for edit/delete permissions', () => {
      const isOwner = (filterMemberId: string, currentMemberId: string): boolean => {
        return filterMemberId === currentMemberId;
      };

      expect(isOwner('member-1', 'member-1')).toBe(true);
      expect(isOwner('member-1', 'member-2')).toBe(false);
    });
  });
});
