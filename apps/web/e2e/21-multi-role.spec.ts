import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Multi-Role Access (Parent)', () => {
  test('parent can see settings with household configuration options', async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Settings page should have form elements for household configuration
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(1);

    // Should show the household name or a settings heading
    const settingsHeading = page.getByText(/setting/i).first();
    await expect(settingsHeading).toBeVisible({ timeout: 10000 });
  });

  test('parent can access developer page with API content', async ({ page }) => {
    await page.goto(`/households/${HID}/developer`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Developer page should show API-related content (keys, endpoints, docs)
    const devContent = page.getByText(/api|key|endpoint|developer|token|webhook/i).first();
    await expect(devContent).toBeVisible({ timeout: 10000 });

    // Should have the #root container rendered
    await expect(page.locator('#root')).toBeVisible();
  });

  test('parent dashboard shows the Hernandez household', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Dashboard should display the household name
    const household = page.getByText(/hernandez/i).first();
    await expect(household).toBeVisible({ timeout: 15000 });

    // Should also have a link or button to open/enter the household
    const openLink = page.getByRole('link').filter({ hasText: /open|view|enter|manage/i }).first();
    const hasOpenLink = await openLink.isVisible().catch(() => false);

    // Or at minimum, the household card/section is clickable
    const householdCard = page.locator('[class*="card"], [class*="household"]').first();
    const hasCard = await householdCard.isVisible().catch(() => false);

    expect(hasOpenLink || hasCard).toBeTruthy();
  });
});
