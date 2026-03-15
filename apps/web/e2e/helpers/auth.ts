import { expect, Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

type AccountRole = keyof typeof TEST_CONFIG.accounts;

/**
 * Sign in as a specific account role.
 * Uses real auth against the production API.
 */
export async function login(page: Page, role: AccountRole = 'parent') {
  const account = TEST_CONFIG.accounts[role];

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByLabel(/password/i).fill(account.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard (Render free tier can be slow)
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Sign out the current user.
 */
export async function logout(page: Page) {
  // Click the Sign Out button in the header
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
