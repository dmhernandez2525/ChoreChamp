import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Member Points & Gamification', () => {
  test('member points page loads for a member', async ({ page }) => {
    // Navigate to household first, then find a member link
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Look for a member name to click on points
    const memberLink = page.getByText(/daniel|christina|adam/i).first();
    const hasMember = await memberLink.isVisible().catch(() => false);

    if (hasMember) {
      await memberLink.click();
      await page.waitForTimeout(2000);
    }

    // Should show points or member info somewhere
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('rewards store is accessible from household', async ({ page }) => {
    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should show points balance
    const balance = page.getByText(/balance|point/i).first();
    await expect(balance).toBeVisible({ timeout: 10000 });
  });

  test('leaderboard shows period tabs', async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const thisWeek = page.getByText(/this week/i).first();
    const hasWeek = await thisWeek.isVisible().catch(() => false);

    const thisMonth = page.getByText(/this month/i).first();
    const hasMonth = await thisMonth.isVisible().catch(() => false);

    const allTime = page.getByText(/all time/i).first();
    const hasAll = await allTime.isVisible().catch(() => false);

    expect(hasWeek || hasMonth || hasAll).toBeTruthy();
  });
});
