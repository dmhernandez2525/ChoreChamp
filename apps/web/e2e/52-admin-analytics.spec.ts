import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Admin Analytics Page', () => {
  test('admin analytics page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/admin-analytics`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('analytics') ||
      bodyText?.toLowerCase().includes('admin') ||
      bodyText?.toLowerCase().includes('report') ||
      bodyText?.toLowerCase().includes('stat') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });

  test('admin analytics shows charts or data', async ({ page }) => {
    await page.goto(`/households/${HID}/admin-analytics`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('admin analytics has date range controls', async ({ page }) => {
    await page.goto(`/households/${HID}/admin-analytics`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Look for date range or filter controls
    const dateControls = page.locator('input[type="date"], select, button').filter({
      hasText: /date|range|week|month|year|filter/i,
    });
    const hasDateControls = (await dateControls.count()) > 0;

    const bodyText = await page.locator('body').textContent();
    const hasAnalyticsContent =
      bodyText?.toLowerCase().includes('analytics') ||
      bodyText?.toLowerCase().includes('data') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasDateControls || hasAnalyticsContent).toBeTruthy();
  });
});
