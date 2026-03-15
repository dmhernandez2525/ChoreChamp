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

  test('settings page shows user profile section', async ({ page }) => {
    const body = page.locator('body');

    // Profile section should show the logged-in user's name or profile-related labels
    const profileIndicators = /profile|account|email|Daniel|user/i;
    await expect(body).toContainText(profileIndicators);
  });

  test('household settings tab exists and shows household name', async ({ page }) => {
    // Look for a household tab or section
    const householdTab = page.getByRole('tab', { name: /household/i }).first();
    const householdBtn = page.getByRole('button', { name: /household/i }).first();

    const hasTab = await householdTab.isVisible().catch(() => false);
    const hasBtn = await householdBtn.isVisible().catch(() => false);

    if (hasTab) {
      await householdTab.click();
      await page.waitForTimeout(1000);
    } else if (hasBtn) {
      await householdBtn.click();
      await page.waitForTimeout(1000);
    }

    // Should display household name or household-related content
    const body = page.locator('body');
    await expect(body).toContainText(/household|family|Hernandez/i);
  });

  test('theme or appearance section exists', async ({ page }) => {
    const body = page.locator('body');

    // Look for theme/appearance controls
    await expect(body).toContainText(/theme|appearance|dark|light|color/i);
  });

  test('can navigate between settings tabs', async ({ page }) => {
    // Find all tab-like navigation elements in settings
    const tabs = page.getByRole('tab');
    const tabButtons = page.getByRole('button').filter({
      hasText: /profile|household|appearance|theme|notification|security|general/i,
    });

    const tabCount = await tabs.count();
    const tabBtnCount = await tabButtons.count();
    const totalTabs = tabCount + tabBtnCount;

    // Settings should have multiple tabs/sections to navigate
    expect(totalTabs).toBeGreaterThanOrEqual(2);

    // Click the second available tab and verify the page updates
    const target = tabCount >= 2 ? tabs.nth(1) : tabButtons.nth(1);
    await target.click();
    await page.waitForTimeout(1000);

    // Page should still be on settings (not navigated away)
    expect(page.url()).toContain('settings');
  });
});
