import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ChoreChamp/i);
  });

  test('app shell renders with navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the app shell loaded (not a blank page or error)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check that basic React rendered (no white screen of death)
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('navigates to sign-in page', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Should show some form of auth UI
    const signInContent = page.locator('[data-testid="sign-in"], form, [role="form"]');
    await expect(signInContent.first()).toBeVisible({ timeout: 10000 });
  });
});
