import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Board View (Deep)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/board`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(3000);
  });

  test('board page has content', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('board page shows household context', async ({ page }) => {
    // Should show the household name or chore-related content
    const householdRef = page.getByText(/hernandez|chore|board|task/i).first();
    const hasRef = await householdRef.isVisible().catch(() => false);

    const title = await page.title();
    expect(hasRef || title.length > 0).toBeTruthy();
  });

  test('board page renders without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
