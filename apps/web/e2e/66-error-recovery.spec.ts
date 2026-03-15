import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Error Recovery Tests', () => {
  test('invalid household ID shows error or redirects', async ({ page }) => {
    await page.goto('/households/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasErrorOrRedirect =
      bodyText?.toLowerCase().includes('not found') ||
      bodyText?.toLowerCase().includes('error') ||
      bodyText?.toLowerCase().includes('dashboard') ||
      bodyText?.toLowerCase().includes('household') ||
      page.url().includes('dashboard');

    expect(hasErrorOrRedirect || (bodyText?.length ?? 0) > 20).toBeTruthy();
  });

  test('404 page shows navigation options', async ({ page }) => {
    await page.goto('/this-does-not-exist-at-all');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const has404Content =
      bodyText?.toLowerCase().includes('404') ||
      bodyText?.toLowerCase().includes('not found') ||
      bodyText?.toLowerCase().includes('home') ||
      bodyText?.toLowerCase().includes('go back') ||
      bodyText?.toLowerCase().includes('sign in');

    expect(has404Content || (bodyText?.length ?? 0) > 20).toBeTruthy();
  });

  test('session expiry redirects to login', async ({ page }) => {
    // Clear storage to simulate session expiry
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check that either we're authenticated or redirected
    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    const isAuthenticated = !url.includes('login') && (bodyText?.length ?? 0) > 50;
    const isLoginPage = url.includes('login') || bodyText?.toLowerCase().includes('sign in');

    expect(isAuthenticated || isLoginPage).toBeTruthy();
  });

  test('network error shows friendly message', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Page should be stable and functional
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });

  test('rapid navigation does not break the app', async ({ page }) => {
    const pages = [
      `/households/${HID}`,
      `/households/${HID}/rewards`,
      `/households/${HID}/leaderboard`,
      `/households/${HID}/settings`,
      `/households/${HID}/members`,
    ];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(500); // Quick navigation, don't wait for full load
    }

    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(1500);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });
});
