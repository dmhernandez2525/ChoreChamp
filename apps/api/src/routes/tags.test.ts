import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6b7280'),
});

const addChoreTagSchema = z.object({
  tagId: z.string().uuid(),
});

const VALID_UUID = '11111111-1111-1111-1111-111111111111';

describe('tags route logic', () => {
  describe('createTagSchema validation', () => {
    it('accepts valid tag with name and color', () => {
      const result = createTagSchema.safeParse({ name: 'Urgent', color: '#ff0000' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Urgent');
        expect(result.data.color).toBe('#ff0000');
      }
    });

    it('provides default color when not specified', () => {
      const result = createTagSchema.safeParse({ name: 'Kitchen' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#6b7280');
      }
    });

    it('rejects empty name', () => {
      const result = createTagSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects name exceeding 50 characters', () => {
      const result = createTagSchema.safeParse({ name: 'a'.repeat(51) });
      expect(result.success).toBe(false);
    });

    it('accepts name at exactly 50 characters', () => {
      const result = createTagSchema.safeParse({ name: 'a'.repeat(50) });
      expect(result.success).toBe(true);
    });

    it('rejects invalid hex color (missing #)', () => {
      const result = createTagSchema.safeParse({ name: 'Test', color: 'ff0000' });
      expect(result.success).toBe(false);
    });

    it('rejects hex color with wrong length', () => {
      const result = createTagSchema.safeParse({ name: 'Test', color: '#fff' });
      expect(result.success).toBe(false);
    });

    it('rejects hex color with invalid characters', () => {
      const result = createTagSchema.safeParse({ name: 'Test', color: '#gggggg' });
      expect(result.success).toBe(false);
    });

    it('accepts uppercase hex color', () => {
      const result = createTagSchema.safeParse({ name: 'Test', color: '#AABBCC' });
      expect(result.success).toBe(true);
    });

    it('accepts mixed-case hex color', () => {
      const result = createTagSchema.safeParse({ name: 'Test', color: '#aAbBcC' });
      expect(result.success).toBe(true);
    });
  });

  describe('addChoreTagSchema validation', () => {
    it('accepts valid UUID tagId', () => {
      const result = addChoreTagSchema.safeParse({ tagId: VALID_UUID });
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID tagId', () => {
      const result = addChoreTagSchema.safeParse({ tagId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects missing tagId', () => {
      const result = addChoreTagSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
