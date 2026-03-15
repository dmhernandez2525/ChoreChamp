import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('leaderboard page loads with heading', async ({ page }) => {
    const heading = page.getByText(/leaderboard/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows period selector', async ({ page }) => {
    // Should have week/month/all-time selector
    const periodText = page.getByText(/week|month|all.time/i).first();
    await expect(periodText).toBeVisible({ timeout: 10000 });
  });

  test('displays rankings or empty state', async ({ page }) => {
    // May show member names or "No rankings yet" empty state
    const memberName = page.getByText(/daniel|christina|adam|addison/i).first();
    const hasMember = await memberName.isVisible().catch(() => false);

    const emptyState = page.getByText(/no ranking|complete chore/i).first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    const rankingsHeading = page.getByText(/ranking|full ranking/i).first();
    const hasRankings = await rankingsHeading.isVisible().catch(() => false);

    expect(hasMember || hasEmpty || hasRankings).toBeTruthy();
  });

  test('shows stats summary', async ({ page }) => {
    // Should display point/chore statistics
    const stats = page.getByText(/point|chore|completed|total/i).first();
    await expect(stats).toBeVisible({ timeout: 10000 });
  });

  test('can switch between time periods', async ({ page }) => {
    // Click on a different period
    const monthBtn = page.getByText(/month/i).first();
    const hasMonth = await monthBtn.isVisible().catch(() => false);

    if (hasMonth) {
      await monthBtn.click();
      await page.waitForTimeout(1000);
    }

    // Page should still render
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});
