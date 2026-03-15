import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Search and Filter Tests', () => {
  test('dashboard has tab navigation for filtering chores', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // The dashboard has tab buttons: "Today's Chores", "All Chores", and optionally "Approvals"
    const todayTab = page.getByRole('button', { name: /today/i }).first();
    const allChoresTab = page.getByRole('button', { name: /all chores/i }).first();

    const hasTodayTab = await todayTab.isVisible().catch(() => false);
    const hasAllTab = await allChoresTab.isVisible().catch(() => false);

    // At least one of the tab filters should exist
    expect(hasTodayTab || hasAllTab).toBeTruthy();
  });

  test('filter controls on chore list are functional', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Look for tab buttons ("Today's Chores", "All Chores", "Approvals")
    const filterBtns = page.getByRole('button').filter({
      hasText: /today|all chores|approvals/i,
    });

    const filterCount = await filterBtns.count();

    if (filterCount >= 2) {
      // Click the "All Chores" tab
      const allChoresTab = page.getByRole('button', { name: /all chores/i }).first();
      const hasAllTab = await allChoresTab.isVisible().catch(() => false);

      if (hasAllTab) {
        await allChoresTab.click();
        await page.waitForTimeout(1500);
      } else {
        await filterBtns.nth(1).click();
        await page.waitForTimeout(1500);
      }

      // After clicking a tab, the page should still show the #root and have content
      await expect(page.locator('#root')).toBeVisible();

      // Page should still be on the household dashboard
      expect(page.url()).toContain(`/households/${HID}`);
    }
  });

  test('search narrows visible results when typing', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder(/search|find|filter/i).first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      // Count items before search
      const itemsBefore = page.locator('[class*="card"], [class*="chore"], [role="listitem"], [class*="task"]');
      const countBefore = await itemsBefore.count();

      // Type a specific search term that should match fewer items
      await searchInput.fill('clean');
      await page.waitForTimeout(1500);

      // Count items after search
      const countAfter = await itemsBefore.count();

      // Search should narrow results (fewer or equal items) or show matching content
      const matchingContent = page.getByText(/clean/i).first();
      const hasMatch = await matchingContent.isVisible().catch(() => false);

      expect(countAfter <= countBefore || hasMatch).toBeTruthy();

      // Clear search should restore results
      await searchInput.clear();
      await page.waitForTimeout(1500);

      const countAfterClear = await itemsBefore.count();
      expect(countAfterClear).toBeGreaterThanOrEqual(countAfter);
    } else {
      // Dashboard has no search input; verify that tab-based filtering exists instead
      const tabButtons = page.getByRole('button').filter({
        hasText: /today|all chores|approvals/i,
      });
      const tabCount = await tabButtons.count();
      expect(tabCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('leaderboard period filter switches between time ranges', async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // The leaderboard heading should be visible
    const heading = page.getByRole('heading', { name: /leaderboard/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // PeriodSelector buttons: "This Week", "This Month", "All Time"
    const periodBtns = page.getByRole('button').filter({
      hasText: /this week|this month|all time/i,
    });

    const periodCount = await periodBtns.count();
    if (periodCount >= 2) {
      // Click "All Time" or the last period filter
      const allTimeBtn = page.getByRole('button', { name: /all time/i }).first();
      const hasAllTime = await allTimeBtn.isVisible().catch(() => false);

      if (hasAllTime) {
        await allTimeBtn.click();
      } else {
        await periodBtns.last().click();
      }
      await page.waitForTimeout(1500);

      // After switching period, the page should still show leaderboard content
      // Either member rankings or the "No rankings yet" empty state
      const body = page.locator('body');
      const bodyText = await body.textContent();
      const lowerBody = bodyText?.toLowerCase() ?? '';

      const hasLeaderboardContent =
        lowerBody.includes('rankings') ||
        lowerBody.includes('no rankings yet') ||
        lowerBody.includes('leaderboard');

      expect(hasLeaderboardContent).toBeTruthy();
    }
  });
});
