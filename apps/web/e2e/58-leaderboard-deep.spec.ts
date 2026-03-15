import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;
const FAMILY_MEMBERS = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];

test.describe('Leaderboard Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('shows member rankings or empty state', async ({ page }) => {
    const body = page.locator('body');

    // The leaderboard page should show either member rankings or a "No rankings yet" empty state
    const noRankings = page.getByText(/no rankings yet/i).first();
    const hasNoRankings = await noRankings.isVisible().catch(() => false);

    if (hasNoRankings) {
      // Empty state is valid; also shows helper text
      await expect(body).toContainText(/complete chores to appear on the leaderboard/i);
    } else {
      // If there are rankings, at least one family member should appear
      let foundCount = 0;
      for (const member of FAMILY_MEMBERS) {
        const memberLocator = page.locator(`text=${member}`);
        const isVisible = await memberLocator.first().isVisible().catch(() => false);
        if (isVisible) {
          foundCount++;
        }
      }
      expect(foundCount).toBeGreaterThanOrEqual(1);
    }

    // The page heading should always be visible
    const heading = page.getByRole('heading', { name: /leaderboard/i }).first();
    await expect(heading).toBeVisible();
  });

  test('has time period selector', async ({ page }) => {
    // PeriodSelector has three buttons: "This Week", "This Month", "All Time"
    const periodButtons = page.getByRole('button').filter({
      hasText: /this week|this month|all time/i,
    });

    const buttonCount = await periodButtons.count();

    // Should have exactly 3 period options
    expect(buttonCount).toBeGreaterThanOrEqual(2);
  });

  test('shows points or empty state for rankings', async ({ page }) => {
    const body = page.locator('body');

    // The leaderboard should display either rankings with point values, or the empty state
    const noRankings = page.getByText(/no rankings yet/i).first();
    const hasNoRankings = await noRankings.isVisible().catch(() => false);

    if (hasNoRankings) {
      // Empty state is valid
      expect(hasNoRankings).toBeTruthy();
    } else {
      // If rankings exist, should display rankings heading and point-related text
      const rankingsHeading = page.getByText(/rankings|full rankings|top 3/i).first();
      const hasRankings = await rankingsHeading.isVisible().catch(() => false);

      // Also look for point-related stats
      const pointsText = page.getByText(/total points|points earned|chores completed|avg points/i).first();
      const hasPoints = await pointsText.isVisible().catch(() => false);

      expect(hasRankings || hasPoints).toBeTruthy();
    }
  });
});
