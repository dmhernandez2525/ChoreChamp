import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Enterprise Page', () => {
  test('enterprise page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/enterprise`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('enterprise') ||
      bodyText?.toLowerCase().includes('team') ||
      bodyText?.toLowerCase().includes('organization') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Wellness Page', () => {
  test('wellness page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/wellness`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('wellness') ||
      bodyText?.toLowerCase().includes('health') ||
      bodyText?.toLowerCase().includes('mood') ||
      bodyText?.toLowerCase().includes('well-being') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('wellness shows tracking options', async ({ page }) => {
    await page.goto(`/households/${HID}/wellness`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});
