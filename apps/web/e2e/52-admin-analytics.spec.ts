import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Admin Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/admin-analytics`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('analytics shows dashboard with metrics', async ({ page }) => {
    // Should display analytics heading or dashboard label
    const heading = page.getByText(/analytics|admin|dashboard|overview/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Should show metric values (numbers, percentages, or stat cards)
    const metricContent = page.getByText(/total|average|completion|chore|member|point/i).first();
    const hasMetrics = await metricContent.isVisible().catch(() => false);

    // Or displays chart/graph areas
    const chartArea = page.locator('canvas, svg, [class*="chart"], [class*="Chart"], [role="img"]').first();
    const hasChart = await chartArea.isVisible().catch(() => false);

    expect(hasMetrics || hasChart).toBeTruthy();
  });

  test('has tabs or sections for different analytics views', async ({ page }) => {
    // Look for tabs, nav pills, or section headings that divide analytics
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    const sectionButtons = page.getByRole('button').filter({
      hasText: /overview|member|chore|trend|weekly|monthly|summary|detail/i,
    });
    const buttonCount = await sectionButtons.count();

    const sectionHeadings = page.getByRole('heading').filter({
      hasText: /overview|member|chore|completion|leaderboard|trend/i,
    });
    const headingCount = await sectionHeadings.count();

    // Should have multiple tabs, filter buttons, or section headings
    expect(tabCount > 0 || buttonCount > 0 || headingCount > 0).toBeTruthy();
  });
});
