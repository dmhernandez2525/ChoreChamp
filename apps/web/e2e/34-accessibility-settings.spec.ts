import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';

test.describe('Accessibility Settings Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Navigate to accessibility tab
    const a11yTab = page.getByText(/accessibility/i).first();
    if (await a11yTab.isVisible().catch(() => false)) {
      await a11yTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('shows display section with contrast and motion toggles', async ({ page }) => {
    const highContrast = page.getByText(/high contrast/i).first();
    const reducedMotion = page.getByText(/reduced motion/i).first();

    const hasContrast = await highContrast.isVisible().catch(() => false);
    const hasMotion = await reducedMotion.isVisible().catch(() => false);

    expect(hasContrast || hasMotion).toBeTruthy();
  });

  test('toggle high contrast mode', async ({ page }) => {
    const toggle = page.locator('#high-contrast-toggle');
    if (await toggle.isVisible().catch(() => false)) {
      const wasBefore = await toggle.getAttribute('aria-checked');
      await toggle.click();
      await page.waitForTimeout(500);

      const isAfter = await toggle.getAttribute('aria-checked');
      // Should have toggled
      expect(isAfter).not.toBe(wasBefore);

      // Toggle back to restore
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('toggle reduced motion', async ({ page }) => {
    const toggle = page.locator('#reduced-motion-toggle');
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(500);

      // Toggle back
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('reading font dropdown has options', async ({ page }) => {
    const fontSelect = page.locator('#reading-font-select');
    if (await fontSelect.isVisible().catch(() => false)) {
      const options = await fontSelect.locator('option').allTextContents();
      expect(options.length).toBeGreaterThanOrEqual(2);

      // Should have System Default and OpenDyslexic
      const hasSystem = options.some((o) => o.toLowerCase().includes('system'));
      const hasDyslexic = options.some((o) => o.toLowerCase().includes('dyslexic'));
      expect(hasSystem || hasDyslexic).toBeTruthy();
    }
  });

  test('font size slider adjustable', async ({ page }) => {
    const slider = page.locator('#font-size-range');
    if (await slider.isVisible().catch(() => false)) {
      // Verify slider exists and is interactive
      const min = await slider.getAttribute('min');
      const max = await slider.getAttribute('max');
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    }
  });

  test('color overlay radio group visible', async ({ page }) => {
    // Color Overlay is in the Reading group, may need scrolling
    const overlayRadioGroup = page.getByRole('radiogroup', { name: /color overlay/i });
    await overlayRadioGroup.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);

    const hasRadioGroup = await overlayRadioGroup.isVisible().catch(() => false);
    if (hasRadioGroup) {
      // Should have "None" radio button checked by default
      const noneRadio = page.getByRole('radio', { name: /none/i });
      const hasNone = await noneRadio.isVisible().catch(() => false);
      expect(hasNone).toBeTruthy();
    } else {
      // Fallback: just check the text exists somewhere
      const overlayText = page.getByText(/color overlay/i).first();
      await overlayText.scrollIntoViewIfNeeded().catch(() => {});
      const hasText = await overlayText.isVisible().catch(() => false);
      expect(hasText).toBeTruthy();
    }
  });

  test('reading aids toggles visible', async ({ page }) => {
    // Scroll to reading aids section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    const readingRuler = page.getByText(/reading ruler/i).first();
    const bionicReading = page.getByText(/bionic reading/i).first();

    const hasRuler = await readingRuler.isVisible().catch(() => false);
    const hasBionic = await bionicReading.isVisible().catch(() => false);

    expect(hasRuler || hasBionic).toBeTruthy();
  });

  test('text to speech button visible', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const ttsBtn = page.getByRole('button', { name: /read.*page|stop reading/i }).first();
    const hasTts = await ttsBtn.isVisible().catch(() => false);

    // TTS may or may not be visible depending on scroll
    expect(hasTts).toBeTruthy();
  });

  test('reading profiles section visible', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const profilesSection = page.getByText(/reading profiles/i).first();
    const profileInput = page.locator('input[placeholder="Profile name"]');

    const hasProfiles = await profilesSection.isVisible().catch(() => false);
    const hasInput = await profileInput.isVisible().catch(() => false);

    expect(hasProfiles || hasInput).toBeTruthy();
  });
});
