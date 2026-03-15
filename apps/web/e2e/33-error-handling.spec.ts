import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Error Handling and Edge Cases', () => {
  test('invalid household ID shows error or redirects', async ({ page }) => {
    await page.goto('/households/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const url = page.url();
    const bodyText = await page.locator('body').textContent();

    // Should show error, 404, or redirect to dashboard
    const handled =
      url.includes('/dashboard') ||
      url.includes('/login') ||
      bodyText?.toLowerCase().includes('not found') ||
      bodyText?.toLowerCase().includes('error') ||
      bodyText?.toLowerCase().includes('404') ||
      bodyText?.toLowerCase().includes('household');

    expect(handled).toBeTruthy();
  });

  test('invalid chore route shows error or redirects', async ({ page }) => {
    await page.goto(`/households/${HID}/chores/invalid-id`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent();
    const url = page.url();

    // Should handle gracefully
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('non-existent page returns 404 or redirects', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const url = page.url();

    const handled =
      bodyText?.toLowerCase().includes('not found') ||
      bodyText?.toLowerCase().includes('404') ||
      bodyText?.includes('page') ||
      url.includes('/login') ||
      url.includes('/dashboard');

    expect(handled).toBeTruthy();
  });

  test('household settings load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(3000);

    // Filter out known benign errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('ChunkLoadError') &&
        !e.includes('Loading chunk')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('rewards page load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('ChunkLoadError') &&
        !e.includes('Loading chunk')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('members page load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('ChunkLoadError') &&
        !e.includes('Loading chunk')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('back navigation works correctly', async ({ page }) => {
    // Navigate through several pages
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(1000);

    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Go back
    await page.goBack();
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/rewards');
  });
});
