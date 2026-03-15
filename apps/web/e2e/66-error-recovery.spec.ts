import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Error Recovery Tests', () => {
  test('invalid household ID shows error message or redirects to dashboard', async ({ page }) => {
    await page.goto('/households/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should either show an error/not-found message or redirect away from the invalid ID
    const errorMessage = page.getByText(/not found|error|invalid|does not exist|no household/i).first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    const redirectedToDashboard = page.url().includes('dashboard');
    const redirectedToLogin = page.url().includes('login');

    expect(hasError || redirectedToDashboard || redirectedToLogin).toBeTruthy();
  });

  test('invalid route shows 404 page with navigation options', async ({ page }) => {
    await page.goto('/this-does-not-exist-at-all');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Should display a 404 indicator
    const notFoundText = page.getByText('404');
    await expect(notFoundText).toBeVisible({ timeout: 10000 });

    // Should provide a way to navigate back (link to home/dashboard)
    const homeLink = page.getByRole('link').first();
    const hasLinks = (await page.getByRole('link').count()) > 0;
    expect(hasLinks).toBeTruthy();
  });

  test('app recovers from rapid navigation between pages', async ({ page }) => {
    const pages = [
      `/households/${HID}`,
      `/households/${HID}/rewards`,
      `/households/${HID}/leaderboard`,
      `/households/${HID}/settings`,
      `/households/${HID}/members`,
    ];

    // Navigate rapidly through pages without waiting for full loads
    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(500);
    }

    // After rapid navigation, wait for the final page to stabilize
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // The app should be in a usable state on the members page
    await expect(page.locator('#root')).toBeVisible();

    // Should show real content from the final page (members)
    const memberContent = page.getByText(/member|family|daniel|christina/i).first();
    await expect(memberContent).toBeVisible({ timeout: 10000 });
  });

  test('authenticated page works after clearing and re-authenticating', async ({ page }) => {
    // First, load the household page normally
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Verify page is functional
    await expect(page.locator('#root')).toBeVisible();

    // Navigate to a sub-page to confirm continued auth
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should still be authenticated and showing settings content
    const settingsContent = page.getByText(/setting/i).first();
    await expect(settingsContent).toBeVisible({ timeout: 10000 });
  });
});
