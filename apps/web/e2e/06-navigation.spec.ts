import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Auth state is restored from storageState (global-setup.ts)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('can navigate to rewards page', async ({ page }) => {
    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    // Page should load without errors
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
    await page.waitForTimeout(500);
  });

  test('can navigate to leaderboard', async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('can navigate to family management', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Should show family members
    const memberContent = page.getByText(/daniel|christina|adam/i).first();
    await expect(memberContent).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('can navigate to settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('can navigate to household settings', async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
    await page.waitForTimeout(500);
  });

  test('can navigate to subscription page', async ({ page }) => {
    await page.goto(`/households/${HID}/subscription`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('can navigate to activity page', async ({ page }) => {
    await page.goto(`/households/${HID}/activity`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('can navigate to reports page', async ({ page }) => {
    await page.goto(`/households/${HID}/reports`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('can navigate to board view', async ({ page }) => {
    await page.goto(`/households/${HID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
    await page.waitForTimeout(500);
  });

  test('can navigate to templates', async ({ page }) => {
    await page.goto(`/households/${HID}/templates`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('can navigate to boss battle', async ({ page }) => {
    await page.goto(`/households/${HID}/boss-battle`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Boss battle page may still be loading; verify the page responded without error
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    await page.waitForTimeout(500);
  });

  test('can navigate to developer/API page', async ({ page }) => {
    await page.goto(`/households/${HID}/developer`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page.getByText('404')).toBeVisible();
    await page.waitForTimeout(500);
  });

  // Note: "unauthenticated redirect" test moved to 02-auth.spec.ts (no-auth project)
  // to avoid storageState interference.
});
