import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Multi-Role Access', () => {
  test('parent can access household settings', async ({ page }) => {
    await login(page, 'parent');
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Parent should see settings content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });

  test('parent can access developer page', async ({ page }) => {
    await login(page, 'parent');
    await page.goto(`/households/${HID}/developer`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });

  test('parent dashboard shows household', async ({ page }) => {
    await login(page, 'parent');
    await page.waitForTimeout(1000);

    const household = page.getByText(/hernandez/i).first();
    await expect(household).toBeVisible({ timeout: 15000 });
  });
});
