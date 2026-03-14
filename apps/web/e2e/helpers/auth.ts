import { expect, Page } from '@playwright/test';

/**
 * Login helper for E2E tests.
 * Supports both real auth and demo mode.
 */
export async function login(page: Page, role: 'parent' | 'child' = 'parent') {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check if demo mode is active
  const isDemoMode = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="demo-mode"]');
    return meta?.getAttribute('content') === 'true';
  });

  if (isDemoMode) {
    // Demo mode: select role
    const roleButton = page.getByRole('button', { name: new RegExp(role, 'i') });
    await roleButton.click();
  } else {
    // Real auth: fill login form
    await page.getByPlaceholder('Email').fill(
      role === 'parent' ? 'parent@test.example' : 'child@test.example'
    );
    await page.getByPlaceholder('Password').fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();
  }

  // Wait for dashboard to load
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 20000 });
}

export async function logout(page: Page) {
  await page.getByTestId('user-menu').click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
}
