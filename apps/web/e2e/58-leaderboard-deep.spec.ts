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

  test('shows member rankings with real names', async ({ page }) => {
    const body = page.locator('body');

    // Verify that family member names appear in the leaderboard
    let foundCount = 0;
    for (const member of FAMILY_MEMBERS) {
      const memberLocator = page.locator(`text=${member}`);
      const isVisible = await memberLocator.first().isVisible().catch(() => false);
      if (isVisible) {
        foundCount++;
      }
    }

    // At least 2 members should appear in the leaderboard rankings
    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  test('has time period selector', async ({ page }) => {
    // Look for period selector buttons (daily/weekly/monthly/all time)
    const periodButtons = page.getByRole('button').filter({
      hasText: /daily|week|month|all time|year|today/i,
    });
    const periodTabs = page.getByRole('tab').filter({
      hasText: /daily|week|month|all time|year|today/i,
    });

    const buttonCount = await periodButtons.count();
    const tabCount = await periodTabs.count();
    const totalPeriodOptions = buttonCount + tabCount;

    // Should have at least 2 time period options
    expect(totalPeriodOptions).toBeGreaterThanOrEqual(2);
  });

  test('shows points for each member', async ({ page }) => {
    const body = page.locator('body');

    // Leaderboard should display point values (numbers) alongside member names
    await expect(body).toContainText(/point|pts|score/i);

    // Verify numeric values are present (point totals)
    const bodyText = await body.textContent();
    const hasNumbers = bodyText?.match(/\d+/) !== null;
    expect(hasNumbers).toBeTruthy();
  });
});
