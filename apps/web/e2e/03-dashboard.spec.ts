import { test, expect } from '@playwright/test';
import { openHousehold } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Auth state is restored from storageState (global-setup.ts)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('shows welcome message with user name', async ({ page }) => {
    // The page shows "Welcome, {name}!" or "Welcome, there!" if auth hasn't loaded yet
    await expect(page.getByText(/welcome,\s*(daniel|there)!/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);
  });

  test('shows Hernandez Family household card', async ({ page }) => {
    // Wait for households to load from API
    await page.waitForTimeout(2000);
    await expect(page.getByText(/hernandez/i)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);
  });

  test('household card has Open button', async ({ page }) => {
    const openButton = page.getByRole('link', { name: /open/i }).first();
    await expect(openButton).toBeVisible();
    await page.waitForTimeout(300);
  });

  test('shows Add Household option', async ({ page }) => {
    await expect(page.getByText(/add household/i)).toBeVisible();
    await page.waitForTimeout(300);
  });

  test('clicking Open navigates to household dashboard', async ({ page }) => {
    await openHousehold(page);
    await page.waitForTimeout(1000);

    // Should be on a household page
    const url = page.url();
    expect(url).toContain('/households/');
    await page.waitForTimeout(500);
  });
});
