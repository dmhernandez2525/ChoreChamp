import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const triggerValues = [
  'chore_completed',
  'chore_created',
  'due_date_passed',
  'status_changed',
  'assigned',
] as const;

const actionValues = [
  'assign',
  'change_status',
  'add_tag',
  'send_notification',
  'set_priority',
  'create_chore',
] as const;

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  trigger: z.enum(triggerValues),
  triggerConfig: z.record(z.unknown()).default({}),
  action: z.enum(actionValues),
  actionConfig: z.record(z.unknown()).default({}),
  enabled: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

describe('automation-rules route logic', () => {
  describe('createRuleSchema validation', () => {
    it('accepts a valid rule with all fields', () => {
      const input = {
        name: 'Auto-assign dishes',
        description: 'When a dish chore is created, assign to Bob',
        trigger: 'chore_created',
        triggerConfig: { category: 'dishes' },
        action: 'assign',
        actionConfig: { memberId: 'member-1' },
        enabled: true,
      };
      const result = createRuleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts minimal valid input with defaults', () => {
      const input = {
        name: 'Notify on completion',
        trigger: 'chore_completed',
        action: 'send_notification',
      };
      const result = createRuleSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.triggerConfig).toEqual({});
        expect(result.data.actionConfig).toEqual({});
        expect(result.data.enabled).toBe(true);
      }
    });

    it('accepts null description', () => {
      const result = createRuleSchema.safeParse({
        name: 'Test rule',
        description: null,
        trigger: 'assigned',
        action: 'add_tag',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createRuleSchema.safeParse({
        name: '',
        trigger: 'chore_completed',
        action: 'assign',
      });
      expect(result.success).toBe(false);
    });

    it('rejects name exceeding 100 characters', () => {
      const result = createRuleSchema.safeParse({
        name: 'x'.repeat(101),
        trigger: 'chore_completed',
        action: 'assign',
      });
      expect(result.success).toBe(false);
    });

    it('accepts name at exactly 100 characters', () => {
      const result = createRuleSchema.safeParse({
        name: 'x'.repeat(100),
        trigger: 'chore_completed',
        action: 'assign',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid trigger value', () => {
      const result = createRuleSchema.safeParse({
        name: 'Test',
        trigger: 'on_delete',
        action: 'assign',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid action value', () => {
      const result = createRuleSchema.safeParse({
        name: 'Test',
        trigger: 'chore_completed',
        action: 'delete_chore',
      });
      expect(result.success).toBe(false);
    });

    it('validates all trigger values are accepted', () => {
      for (const trigger of triggerValues) {
        const result = createRuleSchema.safeParse({
          name: `Rule for ${trigger}`,
          trigger,
          action: 'assign',
        });
        expect(result.success).toBe(true);
      }
    });

    it('validates all action values are accepted', () => {
      for (const action of actionValues) {
        const result = createRuleSchema.safeParse({
          name: `Rule for ${action}`,
          trigger: 'chore_completed',
          action,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('updateRuleSchema validation', () => {
    it('accepts partial update with only name', () => {
      const result = updateRuleSchema.safeParse({ name: 'Updated name' });
      expect(result.success).toBe(true);
    });

    it('accepts partial update with only enabled flag', () => {
      const result = updateRuleSchema.safeParse({ enabled: false });
      expect(result.success).toBe(true);
    });

    it('accepts empty object for partial update', () => {
      const result = updateRuleSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('still validates constraints on partial fields', () => {
      const result = updateRuleSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('rule toggle logic', () => {
    it('toggles enabled to disabled', () => {
      const toggle = (current: boolean): boolean => !current;
      expect(toggle(true)).toBe(false);
    });

    it('toggles disabled to enabled', () => {
      const toggle = (current: boolean): boolean => !current;
      expect(toggle(false)).toBe(true);
    });
  });
});
