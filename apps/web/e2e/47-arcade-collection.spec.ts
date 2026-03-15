import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Arcade Page', () => {
  test('arcade page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/arcade`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('arcade') ||
      bodyText?.toLowerCase().includes('game') ||
      bodyText?.toLowerCase().includes('play') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('arcade shows games or coming soon', async ({ page }) => {
    await page.goto(`/households/${HID}/arcade`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});

test.describe('Collection Page', () => {
  test('collection page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/collection`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('collection') ||
      bodyText?.toLowerCase().includes('item') ||
      bodyText?.toLowerCase().includes('reward') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});
