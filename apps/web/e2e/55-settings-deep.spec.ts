import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Settings Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('household settings page shows heading', async ({ page }) => {
    // HouseholdSettings page shows "Household Settings" heading
    await expect(
      page.getByRole('heading', { name: /household settings/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('household settings shows household name', async ({ page }) => {
    // Should display "Hernandez Family" somewhere on the page
    const body = page.locator('body');
    await expect(body).toContainText(/hernandez/i, { timeout: 10000 });
  });

  test('household settings shows configuration fields', async ({ page }) => {
    const body = page.locator('body');
    // Should show timezone, week starts on, or points name fields
    await expect(body).toContainText(/timezone|week starts|points name/i, { timeout: 10000 });
  });

  test('household settings has edit or manage options', async ({ page }) => {
    // Should have Edit button or Manage Subscription
    const hasEdit = await page.getByRole('button', { name: /edit/i }).first().isVisible().catch(() => false);
    const hasManage = await page.getByRole('button', { name: /manage/i }).first().isVisible().catch(() => false);
    expect(hasEdit || hasManage).toBeTruthy();
  });
});
