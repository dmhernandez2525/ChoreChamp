import { describe, expect, it } from 'vitest';
import {
  FOCUS_MODE_OPTIONS,
  PROGRESS_STYLE_OPTIONS,
  MAX_ITEMS_PER_VIEW_OPTIONS,
} from './AccessibilityProvider';

describe('Cognitive accessibility constants', () => {
  describe('FOCUS_MODE_OPTIONS', () => {
    it('provides off, moderate, and strict modes', () => {
      expect(FOCUS_MODE_OPTIONS).toEqual(['off', 'moderate', 'strict']);
    });

    it('defaults to off as first option', () => {
      expect(FOCUS_MODE_OPTIONS[0]).toBe('off');
    });
  });

  describe('PROGRESS_STYLE_OPTIONS', () => {
    it('provides 4 visualization styles', () => {
      expect(PROGRESS_STYLE_OPTIONS).toHaveLength(4);
    });

    it('includes bar, steps, checklist, and ring', () => {
      expect(PROGRESS_STYLE_OPTIONS).toContain('bar');
      expect(PROGRESS_STYLE_OPTIONS).toContain('steps');
      expect(PROGRESS_STYLE_OPTIONS).toContain('checklist');
      expect(PROGRESS_STYLE_OPTIONS).toContain('ring');
    });

    it('defaults to bar as first option', () => {
      expect(PROGRESS_STYLE_OPTIONS[0]).toBe('bar');
    });
  });

  describe('MAX_ITEMS_PER_VIEW_OPTIONS', () => {
    it('provides 4 options including unlimited', () => {
      expect(MAX_ITEMS_PER_VIEW_OPTIONS).toHaveLength(4);
    });

    it('includes small, medium, large, and unlimited (0)', () => {
      expect(MAX_ITEMS_PER_VIEW_OPTIONS).toContain(3);
      expect(MAX_ITEMS_PER_VIEW_OPTIONS).toContain(5);
      expect(MAX_ITEMS_PER_VIEW_OPTIONS).toContain(10);
      expect(MAX_ITEMS_PER_VIEW_OPTIONS).toContain(0);
    });

    it('0 represents unlimited items', () => {
      const unlimited = MAX_ITEMS_PER_VIEW_OPTIONS[MAX_ITEMS_PER_VIEW_OPTIONS.length - 1];
      expect(unlimited).toBe(0);
    });
  });
});

describe('Cognitive accessibility feature design', () => {
  it('focus mode has progressive strictness levels', () => {
    const levels = [...FOCUS_MODE_OPTIONS];
    expect(levels.indexOf('off')).toBeLessThan(levels.indexOf('moderate'));
    expect(levels.indexOf('moderate')).toBeLessThan(levels.indexOf('strict'));
  });

  it('progress styles cover both linear and circular visualizations', () => {
    const linear = PROGRESS_STYLE_OPTIONS.filter((s) => s === 'bar' || s === 'steps');
    const circular = PROGRESS_STYLE_OPTIONS.filter((s) => s === 'ring');
    expect(linear.length).toBeGreaterThanOrEqual(1);
    expect(circular.length).toBeGreaterThanOrEqual(1);
  });

  it('max items options allow restriction for reduced cognitive load', () => {
    const restricted = MAX_ITEMS_PER_VIEW_OPTIONS.filter((n) => n > 0);
    expect(restricted.length).toBeGreaterThanOrEqual(2);
    restricted.forEach((n) => expect(n).toBeLessThanOrEqual(10));
  });
});
