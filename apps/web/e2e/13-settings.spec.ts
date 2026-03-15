import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('User Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(1000);
  });

  test('settings page loads with heading', async ({ page }) => {
    const heading = page.getByText(/setting/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows profile tab', async ({ page }) => {
    const profileTab = page.getByText(/profile/i).first();
    await expect(profileTab).toBeVisible({ timeout: 10000 });
  });

  test('shows notifications tab', async ({ page }) => {
    const notifTab = page.getByText(/notification/i).first();
    await expect(notifTab).toBeVisible({ timeout: 10000 });
  });

  test('shows security tab', async ({ page }) => {
    const securityTab = page.getByText(/security/i).first();
    await expect(securityTab).toBeVisible({ timeout: 10000 });
  });

  test('shows accessibility tab', async ({ page }) => {
    const a11yTab = page.getByText(/accessibility/i).first();
    await expect(a11yTab).toBeVisible({ timeout: 10000 });
  });

  test('shows language tab', async ({ page }) => {
    const langTab = page.getByText(/language/i).first();
    await expect(langTab).toBeVisible({ timeout: 10000 });
  });

  test('can switch to notifications tab', async ({ page }) => {
    const notifTab = page.getByText(/notification/i).first();
    await notifTab.click();
    await page.waitForTimeout(1000);

    // Should show notification preferences
    const notifContent = page.getByText(/email|reminder|weekly|streak|push/i).first();
    await expect(notifContent).toBeVisible({ timeout: 10000 });
  });

  test('can switch to security tab', async ({ page }) => {
    const securityTab = page.getByText(/security/i).first();
    await securityTab.click();
    await page.waitForTimeout(1000);

    // Should show password or security options
    const secContent = page.getByText(/password|delete.*account/i).first();
    await expect(secContent).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Household Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('household settings page loads', async ({ page }) => {
    const heading = page.getByText(/household.*setting|setting/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows household name field for parent', async ({ page }) => {
    const nameField = page.getByText(/household.*name|name/i).first();
    await expect(nameField).toBeVisible({ timeout: 10000 });
  });

  test('shows timezone setting', async ({ page }) => {
    const timezone = page.getByText(/timezone|time.*zone/i).first();
    const hasTz = await timezone.isVisible().catch(() => false);

    // Or shows week start setting
    const weekStart = page.getByText(/week.*start/i).first();
    const hasWeek = await weekStart.isVisible().catch(() => false);

    expect(hasTz || hasWeek).toBeTruthy();
  });

  test('parent sees delete household option', async ({ page }) => {
    const deleteBtn = page.getByText(/delete.*household|leave.*household/i).first();
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
  });
});
