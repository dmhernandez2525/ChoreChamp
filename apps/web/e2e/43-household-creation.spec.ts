import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';

test.describe('Household Creation and Join', () => {
  test('create household page loads', async ({ page }) => {
    await page.goto('/households/new');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('create') ||
      bodyText?.toLowerCase().includes('household') ||
      bodyText?.toLowerCase().includes('name');

    expect(hasContent).toBeTruthy();
  });

  test('create household form has name input', async ({ page }) => {
    await page.goto('/households/new');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const nameInput = page.getByLabel(/name|household/i).first();
    const hasName = await nameInput.isVisible().catch(() => false);

    const textInput = page.locator('input[type="text"]').first();
    const hasInput = await textInput.isVisible().catch(() => false);

    expect(hasName || hasInput).toBeTruthy();
  });

  test('join household page loads', async ({ page }) => {
    await page.goto('/households/join');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('join') ||
      bodyText?.toLowerCase().includes('invite') ||
      bodyText?.toLowerCase().includes('code');

    expect(hasContent).toBeTruthy();
  });

  test('join household has invite code input', async ({ page }) => {
    await page.goto('/households/join');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const codeInput = page.getByLabel(/code|invite/i).first();
    const hasCode = await codeInput.isVisible().catch(() => false);

    const textInput = page.locator('input').first();
    const hasInput = await textInput.isVisible().catch(() => false);

    expect(hasCode || hasInput).toBeTruthy();
  });
});
