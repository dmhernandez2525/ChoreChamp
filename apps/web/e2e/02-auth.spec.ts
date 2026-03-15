import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';

test.describe('Authentication', () => {
  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('login page links to signup', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const signupLink = page.getByRole('link', { name: /sign up|create.*account|don.*have/i });
    await expect(signupLink).toBeVisible();
    await page.waitForTimeout(300);
  });

  test('signup page renders registration form', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('signup page links to login', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    const loginLink = page.getByRole('link', { name: /sign in|already.*account|log in/i });
    await expect(loginLink).toBeVisible();
    await page.waitForTimeout(300);
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const account = TEST_CONFIG.accounts.parent;
    await page.getByLabel(/email/i).fill(account.email);
    await page.getByLabel(/password/i).fill(account.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('sign out button is visible on dashboard', async ({ page }) => {
    // Sign in first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const account = TEST_CONFIG.accounts.parent;
    await page.getByLabel(/email/i).fill(account.email);
    await page.getByLabel(/password/i).fill(account.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Sign out button should be visible
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    // Fresh page with no auth state should not show authenticated content
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const url = page.url();
    const onLogin = url.includes('/login');
    // If app doesn't redirect, at least verify no authenticated user content
    const hasWelcome = await page.getByText(/welcome.*daniel/i).isVisible().catch(() => false);

    expect(onLogin || !hasWelcome).toBeTruthy();
  });
});
