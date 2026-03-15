import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

test.describe('Responsive Layout Tests', () => {
  for (const viewport of viewports) {
    test(`dashboard renders on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/households/${HID}`);
      await page.waitForLoadState('networkidle');
      await ensureAuthenticated(page);
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();

      // No horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // Small tolerance
    });

    test(`settings renders on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/households/${HID}/settings`);
      await page.waitForLoadState('networkidle');
      await ensureAuthenticated(page);
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    });

    test(`rewards renders on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/households/${HID}/rewards`);
      await page.waitForLoadState('networkidle');
      await ensureAuthenticated(page);
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    });
  }
});
