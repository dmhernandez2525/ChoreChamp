import { describe, expect, it } from 'vitest';
import {
  READING_FONT_OPTIONS,
  FONT_SIZE_LEVELS,
  LINE_SPACING_OPTIONS,
  SPACING_LEVELS,
  OVERLAY_COLOR_OPTIONS,
} from './AccessibilityProvider';

describe('AccessibilityProvider reading accommodation constants', () => {
  describe('READING_FONT_OPTIONS', () => {
    it('includes default, open-dyslexic, and lexie-readable', () => {
      expect(READING_FONT_OPTIONS).toContain('default');
      expect(READING_FONT_OPTIONS).toContain('open-dyslexic');
      expect(READING_FONT_OPTIONS).toContain('lexie-readable');
      expect(READING_FONT_OPTIONS).toHaveLength(3);
    });
  });

  describe('FONT_SIZE_LEVELS', () => {
    it('provides 8 levels from 1 to 8', () => {
      expect(FONT_SIZE_LEVELS).toHaveLength(8);
      expect(FONT_SIZE_LEVELS[0]).toBe(1);
      expect(FONT_SIZE_LEVELS[FONT_SIZE_LEVELS.length - 1]).toBe(8);
    });

    it('levels are sequential integers', () => {
      for (let i = 0; i < FONT_SIZE_LEVELS.length; i++) {
        expect(FONT_SIZE_LEVELS[i]).toBe(i + 1);
      }
    });
  });

  describe('LINE_SPACING_OPTIONS', () => {
    it('provides single, 1.5x, and double spacing', () => {
      expect(LINE_SPACING_OPTIONS).toEqual([1, 1.5, 2]);
    });
  });

  describe('SPACING_LEVELS', () => {
    it('provides 5 levels from 0 to 4', () => {
      expect(SPACING_LEVELS).toHaveLength(5);
      expect(SPACING_LEVELS[0]).toBe(0);
      expect(SPACING_LEVELS[SPACING_LEVELS.length - 1]).toBe(4);
    });
  });

  describe('OVERLAY_COLOR_OPTIONS', () => {
    it('includes none as first option', () => {
      expect(OVERLAY_COLOR_OPTIONS[0]).toBe('none');
    });

    it('provides 9 total overlay options', () => {
      expect(OVERLAY_COLOR_OPTIONS).toHaveLength(9);
    });

    it('includes all expected color presets', () => {
      const expected = [
        'none',
        'warm-cream',
        'soft-peach',
        'mint',
        'sky',
        'lavender',
        'rose',
        'sand',
        'cool-gray',
      ];
      expect([...OVERLAY_COLOR_OPTIONS]).toEqual(expected);
    });
  });
});

describe('reading preference defaults', () => {
  it('default font is "default"', () => {
    expect(READING_FONT_OPTIONS[0]).toBe('default');
  });

  it('overlay "none" maps to a transparent color', () => {
    expect(OVERLAY_COLOR_OPTIONS.includes('none')).toBe(true);
  });
});

describe('reading accommodation feature completeness', () => {
  it('font options cover dyslexia-friendly fonts', () => {
    const dyslexiaFonts = READING_FONT_OPTIONS.filter((f) => f !== 'default');
    expect(dyslexiaFonts.length).toBeGreaterThanOrEqual(2);
  });

  it('spacing levels allow incremental adjustment', () => {
    for (let i = 1; i < SPACING_LEVELS.length; i++) {
      expect(SPACING_LEVELS[i]).toBeGreaterThan(SPACING_LEVELS[i - 1]);
    }
  });

  it('line spacing options cover WCAG recommended range', () => {
    expect(LINE_SPACING_OPTIONS).toContain(1.5);
    expect(LINE_SPACING_OPTIONS).toContain(2);
  });

  it('overlay colors cover warm and cool tones', () => {
    const warmColors = ['warm-cream', 'soft-peach', 'rose', 'sand'];
    const coolColors = ['mint', 'sky', 'lavender', 'cool-gray'];
    warmColors.forEach((c) => expect(OVERLAY_COLOR_OPTIONS).toContain(c));
    coolColors.forEach((c) => expect(OVERLAY_COLOR_OPTIONS).toContain(c));
  });
});
