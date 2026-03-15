import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Responsive & Accessibility', () => {
  test('dashboard renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('household dashboard renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('landing page renders on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('login page is accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('pages have meaningful titles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const images = page.locator('img');
    const count = await images.count();

    // If there are images, check they have alt text
    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // alt can be empty string (decorative) but should exist
      expect(alt !== null).toBeTruthy();
    }
  });

  test('no horizontal scroll on mobile dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Allow 5px tolerance for scrollbar differences
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
