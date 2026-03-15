import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Role-Based Access - Parent (authenticated via storageState)', () => {
  test('parent can access settings page with configuration options', async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Settings page should display configuration UI
    const settingsContent = page.getByText(/setting|household|name|notification|preference/i).first();
    await expect(settingsContent).toBeVisible({ timeout: 10000 });

    // Should have interactive form elements
    const formElements = page.locator('input, select, textarea, button[type="submit"]');
    const formCount = await formElements.count();
    expect(formCount).toBeGreaterThanOrEqual(1);
  });

  test('dashboard loads with household information for authenticated user', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should show the Hernandez household
    const household = page.getByText(/hernandez/i).first();
    await expect(household).toBeVisible({ timeout: 15000 });

    // Dashboard should have navigation links
    const links = page.getByRole('link');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThanOrEqual(1);
  });

  test('parent can access household member management with real members', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should display family member names (household has 5 members)
    const memberNames = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];
    let foundCount = 0;

    for (const name of memberNames) {
      const locator = page.getByText(name, { exact: false }).first();
      const visible = await locator.isVisible().catch(() => false);
      if (visible) foundCount++;
    }

    // Should find at least 3 of the 5 family members
    expect(foundCount).toBeGreaterThanOrEqual(3);
  });
});
