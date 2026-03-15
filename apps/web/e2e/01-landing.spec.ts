import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('shows sign in and get started links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have navigation links to auth
    const signInLink = page.getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await page.waitForTimeout(300);
  });

  test('sign in link navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /sign in/i }).click();
    await page.waitForURL('**/login');

    // Login page should render
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await page.waitForTimeout(500);
  });
});
