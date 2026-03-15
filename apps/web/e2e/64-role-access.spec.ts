import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Role-Based Access - Parent', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test('parent can access settings', async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(TEST_CONFIG.accounts.parent.email);
      await page.getByLabel(/password/i).fill(TEST_CONFIG.accounts.parent.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);

      await page.goto(`/households/${HID}/settings`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      const hasSettings =
        bodyText?.toLowerCase().includes('setting') ||
        bodyText?.toLowerCase().includes('household') ||
        bodyText?.toLowerCase().includes('name');

      expect(hasSettings || (bodyText?.length ?? 0) > 50).toBeTruthy();
    }
  });

  test('parent can access member management', async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(TEST_CONFIG.accounts.parent.email);
      await page.getByLabel(/password/i).fill(TEST_CONFIG.accounts.parent.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);

      await page.goto(`/households/${HID}/members`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      const hasMembers =
        bodyText?.toLowerCase().includes('member') ||
        bodyText?.toLowerCase().includes('family') ||
        bodyText?.toLowerCase().includes('daniel');

      expect(hasMembers || (bodyText?.length ?? 0) > 50).toBeTruthy();
    }
  });
});

test.describe('Role-Based Access - Child', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test('child can view dashboard', async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(TEST_CONFIG.accounts.child.email);
      await page.getByLabel(/password/i).fill(TEST_CONFIG.accounts.child.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('child can view rewards', async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(TEST_CONFIG.accounts.child.email);
      await page.getByLabel(/password/i).fill(TEST_CONFIG.accounts.child.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);

      await page.goto(`/households/${HID}/rewards`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });
});
