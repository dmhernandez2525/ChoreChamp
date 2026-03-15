import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Board Page', () => {
  test.beforeEach(async ({ page }) => {
    // Auth state is restored from storageState (global-setup.ts)
    await page.goto(`/households/${HID}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('board page loads without errors', async ({ page }) => {
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('displays board content', async ({ page }) => {
    // Board page should render content (may take time on Render free tier)
    await page.waitForTimeout(2000);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });
});
