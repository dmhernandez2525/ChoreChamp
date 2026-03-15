import { expect, Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

type AccountRole = keyof typeof TEST_CONFIG.accounts;

/**
 * Sign in as a specific account role.
 * Handles rate limiting by waiting and retrying.
 */
export async function login(page: Page, role: AccountRole = 'parent') {
  const account = TEST_CONFIG.accounts[role];
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check for rate limit message before attempting
    const rateLimited = await page.getByText(/too many request/i).isVisible().catch(() => false);
    if (rateLimited) {
      // Wait for rate limit window to reset (15 seconds)
      await page.waitForTimeout(15000);
      continue;
    }

    await page.getByLabel(/email/i).fill(account.email);
    await page.getByLabel(/password/i).fill(account.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect or rate limit error
    try {
      await page.waitForURL('**/dashboard', { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      return; // Success
    } catch {
      if (attempt < maxRetries - 1) {
        // Wait for rate limit window to reset before retrying
        await page.waitForTimeout(15000);
        continue;
      }
      throw new Error(`Login failed after ${maxRetries} attempts`);
    }
  }
}

/**
 * Sign out the current user.
 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL('**/login', { timeout: 10000 });
}

/**
 * Navigate to the Hernandez Family household dashboard.
 */
export async function openHousehold(page: Page) {
  const householdLink = page.getByRole('link', { name: /open/i }).first();
  await householdLink.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Ensure the page is authenticated. If the session expired and we see
 * the login page, re-authenticate and navigate back to the intended URL.
 * Also handles delayed client-side auth redirects.
 */
export async function ensureAuthenticated(page: Page, role: AccountRole = 'parent') {
  // Wait briefly for client-side auth check to potentially redirect
  await page.waitForTimeout(1500);

  const currentUrl = page.url();
  const onLogin = currentUrl.includes('/login');
  const hasLoginForm = await page.getByLabel(/email/i).isVisible().catch(() => false);

  if (onLogin || hasLoginForm) {
    const intendedPath = new URL(currentUrl).pathname;

    await login(page, role);

    if (intendedPath && !intendedPath.includes('/login') && !intendedPath.includes('/dashboard')) {
      await page.goto(intendedPath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  }
}
