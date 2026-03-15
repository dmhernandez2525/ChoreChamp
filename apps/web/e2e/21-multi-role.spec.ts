import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Multi-Role Access (Parent)', () => {
  test('parent can access household settings', async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();

    // Parent should see household name setting
    const nameSetting = page.getByText(/household.*name|name/i).first();
    await expect(nameSetting).toBeVisible({ timeout: 10000 });
  });

  test('parent can access developer page', async ({ page }) => {
    await page.goto(`/households/${HID}/developer`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });

  test('parent dashboard shows household', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const household = page.getByText(/hernandez/i).first();
    await expect(household).toBeVisible({ timeout: 15000 });
  });
});
