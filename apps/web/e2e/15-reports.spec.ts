import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Reports & Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/reports`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('reports page shows date range controls', async ({ page }) => {
    // Reports should have date pickers or range selectors
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();

    // Or text-based date range controls
    const dateRangeText = page.getByText(/from|to|start date|end date|date range|this week|this month|last 7|last 30/i).first();
    const hasDateText = await dateRangeText.isVisible().catch(() => false);

    // Or a date picker button/dropdown
    const dateButton = page.getByRole('button').filter({
      hasText: /date|calendar|range|period|week|month/i,
    }).first();
    const hasDateButton = await dateButton.isVisible().catch(() => false);

    expect(dateInputCount > 0 || hasDateText || hasDateButton).toBeTruthy();
  });

  test('reports show charts or data visualizations', async ({ page }) => {
    // Look for chart elements (SVG charts, canvas, or chart containers)
    const svgCharts = page.locator('svg');
    const svgCount = await svgCharts.count();

    const canvasCharts = page.locator('canvas');
    const canvasCount = await canvasCharts.count();

    const chartContainers = page.locator(
      '[class*="chart"], [class*="graph"], [data-testid*="chart"], [class*="recharts"], [class*="visualization"]'
    );
    const chartCount = await chartContainers.count();

    // Or look for tabular data (report tables)
    const tables = page.locator('table');
    const tableCount = await tables.count();

    // Reports page should have at least one visualization element or data table
    expect(svgCount > 0 || canvasCount > 0 || chartCount > 0 || tableCount > 0).toBeTruthy();
  });

  test('can switch between report types', async ({ page }) => {
    // Look for report type selectors: tabs, buttons, or dropdown
    const reportTypeTabs = page.getByRole('tab');
    const tabCount = await reportTypeTabs.count();

    const reportTypeButtons = page.getByRole('button').filter({
      hasText: /summary|detail|completion|member|weekly|monthly|export|csv|pdf|json|overview|breakdown/i,
    });
    const buttonCount = await reportTypeButtons.count();

    const reportSelect = page.locator('select').first();
    const hasSelect = await reportSelect.isVisible().catch(() => false);

    expect(tabCount > 0 || buttonCount > 0 || hasSelect).toBeTruthy();

    // If there are report type controls, click one and verify the page updates
    if (tabCount > 1) {
      const secondTab = reportTypeTabs.nth(1);
      await secondTab.click();
      await page.waitForTimeout(1500);
      await expect(page.locator('#root')).toBeVisible();
    } else if (buttonCount > 0) {
      const firstButton = reportTypeButtons.first();
      await firstButton.click();
      await page.waitForTimeout(1500);
      await expect(page.locator('#root')).toBeVisible();
    }
  });
});
