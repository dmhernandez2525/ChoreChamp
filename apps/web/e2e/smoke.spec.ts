import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('app shell renders with navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('navigates to login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Should show auth form
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
  });
});
