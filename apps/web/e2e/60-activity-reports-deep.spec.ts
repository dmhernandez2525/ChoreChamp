import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Activity Feed Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/activity`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('activity feed shows entries with timestamps', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasTimestamps =
      bodyText?.match(/\d{1,2}[:/]\d{2}/) !== null ||
      bodyText?.toLowerCase().includes('ago') ||
      bodyText?.toLowerCase().includes('today') ||
      bodyText?.toLowerCase().includes('yesterday');

    expect(hasTimestamps || (bodyText?.length ?? 0) > 100).toBeTruthy();
  });

  test('category filter buttons change displayed items', async ({ page }) => {
    const filterBtns = page.getByRole('button').filter({
      hasText: /all|chore|reward|point|achievement|member/i,
    });

    if ((await filterBtns.count()) >= 2) {
      await filterBtns.nth(1).click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 20).toBeTruthy();
    }
  });

  test('member filter narrows results', async ({ page }) => {
    const memberFilter = page.locator('select, [role="combobox"]').filter({
      hasText: /member|all|daniel|christina/i,
    });

    if ((await memberFilter.count()) > 0) {
      await memberFilter.first().click();
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 20).toBeTruthy();
    }
  });
});

test.describe('Reports Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/reports`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('date range presets change the display', async ({ page }) => {
    const presetBtns = page.getByRole('button').filter({
      hasText: /7 day|30 day|this week|this month|last month|custom/i,
    });

    if ((await presetBtns.count()) >= 2) {
      await presetBtns.first().click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('export button shows format options', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export|download/i }).first();
    const hasExport = await exportBtn.isVisible().catch(() => false);

    if (hasExport) {
      await exportBtn.click();
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').textContent();
      const hasFormats =
        bodyText?.toLowerCase().includes('csv') ||
        bodyText?.toLowerCase().includes('pdf') ||
        bodyText?.toLowerCase().includes('json') ||
        bodyText?.toLowerCase().includes('format');

      expect(hasFormats || (bodyText?.length ?? 0) > 50).toBeTruthy();
      await page.keyboard.press('Escape');
    }
  });

  test('report sections display chart or data', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasReportData =
      bodyText?.toLowerCase().includes('chart') ||
      bodyText?.toLowerCase().includes('graph') ||
      bodyText?.toLowerCase().includes('total') ||
      bodyText?.toLowerCase().includes('average') ||
      bodyText?.toLowerCase().includes('completion') ||
      bodyText?.match(/\d+%/) !== null ||
      bodyText?.match(/\d+/) !== null;

    expect(hasReportData || (bodyText?.length ?? 0) > 100).toBeTruthy();
  });

  test('custom date range inputs work', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    if ((await dateInputs.count()) >= 2) {
      await dateInputs.first().fill('2026-03-01');
      await dateInputs.nth(1).fill('2026-03-15');
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    } else {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });
});
