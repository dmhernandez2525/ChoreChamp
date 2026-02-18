import { describe, expect, it } from 'vitest';
import {
  SENSORY_LEVEL_OPTIONS,
  TRANSITION_STYLE_OPTIONS,
} from './AccessibilityProvider';

describe('Special needs accommodation constants', () => {
  describe('SENSORY_LEVEL_OPTIONS', () => {
    it('provides 3 levels: default, low, minimal', () => {
      expect(SENSORY_LEVEL_OPTIONS).toEqual(['default', 'low', 'minimal']);
    });

    it('defaults to default as first option', () => {
      expect(SENSORY_LEVEL_OPTIONS[0]).toBe('default');
    });

    it('has progressively calmer levels', () => {
      const levels = [...SENSORY_LEVEL_OPTIONS];
      expect(levels.indexOf('default')).toBeLessThan(levels.indexOf('low'));
      expect(levels.indexOf('low')).toBeLessThan(levels.indexOf('minimal'));
    });
  });

  describe('TRANSITION_STYLE_OPTIONS', () => {
    it('provides 3 styles: default, fade, none', () => {
      expect(TRANSITION_STYLE_OPTIONS).toEqual(['default', 'fade', 'none']);
    });

    it('includes a no-transition option for sensory sensitivity', () => {
      expect(TRANSITION_STYLE_OPTIONS).toContain('none');
    });

    it('has progressively simpler transitions', () => {
      const styles = [...TRANSITION_STYLE_OPTIONS];
      expect(styles.indexOf('default')).toBeLessThan(styles.indexOf('fade'));
      expect(styles.indexOf('fade')).toBeLessThan(styles.indexOf('none'));
    });
  });
});

describe('Special needs feature design', () => {
  it('sensory levels cover full range from normal to minimal', () => {
    expect(SENSORY_LEVEL_OPTIONS).toContain('default');
    expect(SENSORY_LEVEL_OPTIONS).toContain('minimal');
  });

  it('transition options provide graduated control', () => {
    expect(TRANSITION_STYLE_OPTIONS.length).toBe(3);
  });
});
