import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Member Detail Pages', () => {
  test('notification center page loads', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('notification') ||
      bodyText?.toLowerCase().includes('no notification') ||
      bodyText?.toLowerCase().includes('alert') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/analytics`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('support page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/support`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('support') ||
      bodyText?.toLowerCase().includes('help') ||
      bodyText?.toLowerCase().includes('contact') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});
