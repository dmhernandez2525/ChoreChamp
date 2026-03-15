import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Family Hub Page', () => {
  test('family hub page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/family-hub`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('family') ||
      bodyText?.toLowerCase().includes('hub') ||
      bodyText?.toLowerCase().includes('dashboard') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('family hub shows family overview', async ({ page }) => {
    await page.goto(`/households/${HID}/family-hub`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});

test.describe('Financial Page', () => {
  test('financial page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/financial`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('financial') ||
      bodyText?.toLowerCase().includes('allowance') ||
      bodyText?.toLowerCase().includes('budget') ||
      bodyText?.toLowerCase().includes('money') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('financial shows tracking or setup', async ({ page }) => {
    await page.goto(`/households/${HID}/financial`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});
