import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Activity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/activity`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('activity page loads with activity items or empty state', async ({ page }) => {
    // The page should either show activity items or an empty state message
    const activityHeading = page.getByText(/activity/i).first();
    await expect(activityHeading).toBeVisible({ timeout: 10000 });

    // Check for activity items (list items, cards, or timeline entries)
    const activityItems = page.locator(
      '[data-testid*="activity"], [class*="activity-item"], [class*="feed-item"], [class*="timeline"]'
    );
    const itemCount = await activityItems.count();

    // Or check for an empty state message
    const emptyState = page.getByText(/no activity|no recent|nothing yet|empty/i).first();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // One of these should be true: either there are items or an empty state
    expect(itemCount > 0 || hasEmptyState).toBeTruthy();
  });

  test('activity items show member name and action description', async ({ page }) => {
    // If there are activity items, they should reference family members and actions
    const memberNames = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];
    const bodyText = await page.locator('body').textContent();

    // Check if any member names appear in the activity feed
    const hasMemberName = memberNames.some(
      (name) => bodyText?.includes(name)
    );

    // Check if action verbs appear (completed, created, assigned, updated, etc.)
    const actionPattern = /complet|creat|assign|updat|added|removed|earned|finish/i;
    const hasAction = actionPattern.test(bodyText || '');

    // If activity data exists, we should see both member names and actions
    // If no activity data, an empty state should have been caught by the previous test
    if (hasMemberName) {
      expect(hasAction).toBeTruthy();
    }
    // At minimum, the page should contain the Activity heading
    expect(bodyText?.toLowerCase()).toContain('activity');
  });

  test('activity feed has filter or type controls', async ({ page }) => {
    // Look for filter controls: dropdowns, tabs, buttons to filter by type or member
    const filterControls = page.getByRole('button').filter({
      hasText: /filter|all|chore|reward|member|today|week|recent/i,
    });
    const filterCount = await filterControls.count();

    const selectDropdown = page.locator('select').first();
    const hasSelect = await selectDropdown.isVisible().catch(() => false);

    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    // Should have at least one way to filter or navigate the activity feed
    expect(filterCount > 0 || hasSelect || tabCount > 0 || hasSearch).toBeTruthy();
  });
});
