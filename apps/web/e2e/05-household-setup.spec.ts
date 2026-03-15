import { test, expect } from '@playwright/test';

test.describe('Household Setup', () => {
  test.beforeEach(async ({ page }) => {
    // Auth state is restored from storageState (global-setup.ts)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('create household page renders form', async ({ page }) => {
    await page.goto('/households/new');
    await page.waitForLoadState('networkidle');

    // Should have household name input
    const nameInput = page.getByLabel(/name/i).first();
    await expect(nameInput).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('join household page renders invite code input', async ({ page }) => {
    await page.goto('/households/join');
    await page.waitForLoadState('networkidle');

    // Should have invite code input
    const codeInput = page.getByLabel(/code|invite/i).first();
    await expect(codeInput).toBeVisible();
    await page.waitForTimeout(500);
  });
});
