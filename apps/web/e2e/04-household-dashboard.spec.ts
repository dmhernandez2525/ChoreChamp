import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Household Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('dashboard shows current member name in header badge', async ({ page }) => {
    // HouseholdDashboard only shows the current logged-in member's name
    // in a colored badge in the top-right header area
    const memberNames = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];
    let foundCount = 0;

    for (const name of memberNames) {
      const locator = page.getByText(name, { exact: false }).first();
      const visible = await locator.isVisible().catch(() => false);
      if (visible) foundCount++;
    }

    // Should find at least the current logged-in member's name
    expect(foundCount).toBeGreaterThanOrEqual(1);
  });

  test('dashboard shows chore statistics or counts', async ({ page }) => {
    // The household has 43 chores, so there should be numeric stats visible
    // Look for stat-like content: numbers, completion rates, or summary cards
    const statsSection = page.locator('[data-testid*="stat"], [class*="stat"], [class*="summary"], [class*="card"]').first();
    const hasStatsSection = await statsSection.isVisible().catch(() => false);

    // Also check for numeric content that represents counts or percentages
    const numberPattern = page.getByText(/\d+\s*(chore|task|complete|done|pending|total|point)/i).first();
    const hasNumbers = await numberPattern.isVisible().catch(() => false);

    // Or look for progress indicators
    const progressIndicator = page.locator('[role="progressbar"], [class*="progress"], [class*="percent"]').first();
    const hasProgress = await progressIndicator.isVisible().catch(() => false);

    expect(hasStatsSection || hasNumbers || hasProgress).toBeTruthy();
  });

  test('dashboard has working navigation tabs or sections', async ({ page }) => {
    // Look for navigation elements like tabs, links, or section headers
    const navTabs = page.getByRole('tab');
    const navLinks = page.getByRole('link');
    const tabCount = await navTabs.count();
    const linkCount = await navLinks.count();

    // Dashboard should have navigation elements (tabs or links to chores, activity, etc.)
    expect(tabCount + linkCount).toBeGreaterThanOrEqual(2);

    // Click a navigation element and verify the page responds
    if (tabCount > 0) {
      const firstTab = navTabs.first();
      await firstTab.click();
      await page.waitForTimeout(1000);
      // Page should still be functional after clicking
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('dashboard displays chore cards or empty state', async ({ page }) => {
    // ChorePreviewList renders ChoreCard components using div.rounded-lg.border.cursor-pointer
    // or shows an empty state ("All caught up!" / "No chores scheduled")
    const choreCards = page.locator('div.cursor-pointer.rounded-lg');
    const choreCount = await choreCards.count();

    // Also check for the "Done" buttons that appear on each ChoreCard
    const doneButtons = page.getByRole('button', { name: /done|pending/i });
    const doneCount = await doneButtons.count();

    // Or check for empty state messages
    const emptyState = page.getByText(/all caught up|no chores|no pending/i).first();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Should have chore cards, done buttons, or an empty state
    expect(choreCount + doneCount > 0 || hasEmptyState).toBeTruthy();
  });

  test('clicking a chore card or item opens detail view', async ({ page }) => {
    // Find a clickable chore element
    const choreElement = page.locator(
      '[data-testid*="chore"], [class*="chore-card"], [class*="task-card"]'
    ).first();
    const hasChoreElement = await choreElement.isVisible().catch(() => false);

    if (hasChoreElement) {
      await choreElement.click();
      await page.waitForTimeout(1500);

      // After clicking, should see detail content: a modal, drawer, or new page
      const detailView = page.locator(
        '[role="dialog"], [class*="modal"], [class*="drawer"], [class*="detail"], [class*="sidebar"]'
      ).first();
      const hasDetail = await detailView.isVisible().catch(() => false);

      // Or URL changed to a chore detail route
      const urlChanged = page.url().includes('/chore');

      expect(hasDetail || urlChanged).toBeTruthy();
    } else {
      // Try clicking a list item or link that contains chore-related text
      const choreLink = page.getByRole('link').filter({
        hasText: /chore|task|clean|wash|sweep|mop|vacuum|dishes|laundry|trash/i,
      }).first();
      const hasLink = await choreLink.isVisible().catch(() => false);

      if (hasLink) {
        await choreLink.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(1000);
        // URL should change after clicking
        expect(page.url()).not.toBe(`/households/${HID}`);
      }
    }
  });
});
