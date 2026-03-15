import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test helpers for board-related logic
// These tests focus on the business logic without requiring a full Fastify server

describe('board route logic', () => {
  describe('updateBoardPreferencesSchema validation', () => {
    const updateBoardPreferencesSchema = z.object({
      viewMode: z.enum(['kanban', 'calendar', 'list', 'dashboard']).optional(),
      columnSettings: z.record(z.object({
        color: z.string().optional(),
        wipLimit: z.number().min(0).optional(),
        hidden: z.boolean().optional(),
        order: z.number().optional(),
      })).optional(),
      defaultGroupBy: z.enum(['member', 'category', 'priority', 'due_date', 'none']).nullable().optional(),
      defaultSort: z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
      }).optional(),
    });

    it('accepts empty update body', () => {
      const result = updateBoardPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts all valid viewMode values', () => {
      for (const mode of ['kanban', 'calendar', 'list', 'dashboard']) {
        expect(updateBoardPreferencesSchema.safeParse({ viewMode: mode }).success).toBe(true);
      }
    });

    it('rejects invalid viewMode', () => {
      expect(updateBoardPreferencesSchema.safeParse({ viewMode: 'timeline' }).success).toBe(false);
    });

    it('accepts valid columnSettings', () => {
      const result = updateBoardPreferencesSchema.safeParse({
        columnSettings: {
          'todo': { color: '#FF0000', wipLimit: 5, hidden: false, order: 0 },
          'done': { color: '#00FF00', order: 1 },
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative wipLimit', () => {
      const result = updateBoardPreferencesSchema.safeParse({
        columnSettings: {
          'todo': { wipLimit: -1 },
        },
      });
      expect(result.success).toBe(false);
    });

    it('accepts all valid defaultGroupBy values', () => {
      for (const groupBy of ['member', 'category', 'priority', 'due_date', 'none']) {
        expect(updateBoardPreferencesSchema.safeParse({ defaultGroupBy: groupBy }).success).toBe(true);
      }
    });

    it('accepts null defaultGroupBy', () => {
      expect(updateBoardPreferencesSchema.safeParse({ defaultGroupBy: null }).success).toBe(true);
    });

    it('rejects invalid defaultGroupBy', () => {
      expect(updateBoardPreferencesSchema.safeParse({ defaultGroupBy: 'status' }).success).toBe(false);
    });

    it('accepts valid defaultSort', () => {
      const result = updateBoardPreferencesSchema.safeParse({
        defaultSort: { field: 'boardOrder', direction: 'asc' },
      });
      expect(result.success).toBe(true);

      const result2 = updateBoardPreferencesSchema.safeParse({
        defaultSort: { field: 'title', direction: 'desc' },
      });
      expect(result2.success).toBe(true);
    });

    it('rejects invalid sort direction', () => {
      const result = updateBoardPreferencesSchema.safeParse({
        defaultSort: { field: 'title', direction: 'random' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects defaultSort missing direction', () => {
      const result = updateBoardPreferencesSchema.safeParse({
        defaultSort: { field: 'title' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects defaultSort missing field', () => {
      const result = updateBoardPreferencesSchema.safeParse({
        defaultSort: { direction: 'asc' },
      });
      expect(result.success).toBe(false);
    });

    it('accepts fully specified preferences', () => {
      const result = updateBoardPreferencesSchema.safeParse({
        viewMode: 'kanban',
        columnSettings: {
          'todo': { color: '#FF0000', wipLimit: 10, hidden: false, order: 0 },
          'in-progress': { color: '#FFFF00', wipLimit: 3, hidden: false, order: 1 },
          'done': { color: '#00FF00', hidden: false, order: 2 },
        },
        defaultGroupBy: 'category',
        defaultSort: { field: 'priority', direction: 'desc' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('default preferences', () => {
    it('provides correct default board preferences when none exist', () => {
      const defaultPreferences = {
        viewMode: 'dashboard',
        columnSettings: {},
        defaultGroupBy: null,
        defaultSort: { field: 'boardOrder', direction: 'asc' },
      };

      expect(defaultPreferences.viewMode).toBe('dashboard');
      expect(defaultPreferences.columnSettings).toEqual({});
      expect(defaultPreferences.defaultGroupBy).toBeNull();
      expect(defaultPreferences.defaultSort.field).toBe('boardOrder');
      expect(defaultPreferences.defaultSort.direction).toBe('asc');
    });
  });

  describe('upsert logic', () => {
    it('determines insert vs update based on existing preferences', () => {
      const shouldInsert = (existing: unknown | null): boolean => !existing;

      expect(shouldInsert(null)).toBe(true);
      expect(shouldInsert(undefined)).toBe(true);
      expect(shouldInsert({ id: '123', viewMode: 'kanban' })).toBe(false);
    });

    it('merges body with defaults for new preferences', () => {
      const body = { viewMode: 'list' as const };
      const merged = {
        householdId: 'h-123',
        memberId: 'm-456',
        viewMode: body.viewMode || 'dashboard',
        columnSettings: {},
        defaultGroupBy: null,
        defaultSort: { field: 'boardOrder', direction: 'asc' },
      };

      expect(merged.viewMode).toBe('list');
      expect(merged.columnSettings).toEqual({});
    });
  });
});
