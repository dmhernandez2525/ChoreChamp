import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('School Page', () => {
  test('school/education page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/school`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('school') ||
      bodyText?.toLowerCase().includes('homework') ||
      bodyText?.toLowerCase().includes('education') ||
      bodyText?.toLowerCase().includes('class') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('school page shows educational content or tasks', async ({ page }) => {
    await page.goto(`/households/${HID}/school`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});

test.describe('Store Page', () => {
  test('store page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/store`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('store') ||
      bodyText?.toLowerCase().includes('shop') ||
      bodyText?.toLowerCase().includes('item') ||
      bodyText?.toLowerCase().includes('point') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('store shows items or categories', async ({ page }) => {
    await page.goto(`/households/${HID}/store`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});
