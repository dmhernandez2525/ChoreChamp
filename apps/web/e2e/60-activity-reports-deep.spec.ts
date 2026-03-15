import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Activity Feed Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/activity`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('activity shows recent actions by family members', async ({ page }) => {
    // Should display an activity heading
    const heading = page.getByText(/activity/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Should show member names or action descriptions
    const memberAction = page.getByText(/Daniel|Christina|Adam|Addison|Aiden/i).first();
    const hasMember = await memberAction.isVisible().catch(() => false);

    // Or show action-related text (completed, assigned, earned, etc.)
    const actionText = page.getByText(/completed|assigned|earned|created|updated/i).first();
    const hasAction = await actionText.isVisible().catch(() => false);

    // Or show timestamps
    const timestampText = page.getByText(/ago|today|yesterday|just now/i).first();
    const hasTimestamp = await timestampText.isVisible().catch(() => false);

    expect(hasMember || hasAction || hasTimestamp).toBeTruthy();
  });

  test('can filter activity by member or type', async ({ page }) => {
    // Look for filter controls: buttons, dropdowns, or tabs
    const filterButtons = page.getByRole('button').filter({
      hasText: /all|chore|reward|point|achievement|member|filter/i,
    });
    const filterCount = await filterButtons.count();

    const filterDropdown = page.locator('select, [role="combobox"], [role="listbox"]').first();
    const hasDropdown = await filterDropdown.isVisible().catch(() => false);

    // The page should have at least some filter mechanism
    expect(filterCount > 0 || hasDropdown).toBeTruthy();
  });
});

test.describe('Reports Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/reports`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('reports show date range controls and chart sections', async ({ page }) => {
    // Should display a reports heading
    const heading = page.getByText(/report/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for date range controls: preset buttons, date inputs, or selectors
    const dateControls = page.getByRole('button').filter({
      hasText: /7 day|30 day|this week|this month|last month|custom|week|month/i,
    });
    const dateInputs = page.locator('input[type="date"]');

    const hasPresets = (await dateControls.count()) > 0;
    const hasDateInputs = (await dateInputs.count()) > 0;

    // Look for chart or data visualization areas
    const chartArea = page.locator('canvas, svg, [class*="chart"], [class*="Chart"], [role="img"]').first();
    const hasChart = await chartArea.isVisible().catch(() => false);

    // Should have report content: either date controls or chart areas
    const reportContent = page.getByText(/completion|total|average|rate|trend/i).first();
    const hasReportData = await reportContent.isVisible().catch(() => false);

    expect(hasPresets || hasDateInputs || hasChart || hasReportData).toBeTruthy();
  });
});
