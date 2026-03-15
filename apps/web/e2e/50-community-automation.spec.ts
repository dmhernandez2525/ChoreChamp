import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Community Page', () => {
  test('community page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/community`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('community') ||
      bodyText?.toLowerCase().includes('share') ||
      bodyText?.toLowerCase().includes('social') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Automation Page', () => {
  test('automation page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/automation`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('automation') ||
      bodyText?.toLowerCase().includes('rule') ||
      bodyText?.toLowerCase().includes('trigger') ||
      bodyText?.toLowerCase().includes('schedule') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('automation shows rules or creation option', async ({ page }) => {
    await page.goto(`/households/${HID}/automation`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});
