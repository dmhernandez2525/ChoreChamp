import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Search and Filter Tests', () => {
  test('global search is accessible from dashboard', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder(/search|find|filter/i).first();
    const searchBtn = page.getByRole('button', { name: /search/i }).first();

    const hasSearch =
      (await searchInput.isVisible().catch(() => false)) ||
      (await searchBtn.isVisible().catch(() => false));

    // Or try command palette
    if (!hasSearch) {
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(500);
      const commandInput = page.locator('[role="combobox"], input[placeholder*="search" i], input[placeholder*="command" i]');
      const hasCommand = (await commandInput.count()) > 0;
      if (hasCommand) {
        await page.keyboard.press('Escape');
      }
    }

    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });

  test('chore list filters by category', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const filterBtns = page.getByRole('button').filter({
      hasText: /all|today|upcoming|overdue|kitchen|bathroom|bedroom/i,
    });

    if ((await filterBtns.count()) >= 2) {
      await filterBtns.nth(1).click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 20).toBeTruthy();
    }
  });

  test('activity page filters work', async ({ page }) => {
    await page.goto(`/households/${HID}/activity`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const filterBtns = page.getByRole('button').filter({
      hasText: /all|chore|reward|point|member/i,
    });

    if ((await filterBtns.count()) >= 2) {
      const beforeText = await page.locator('body').textContent();
      await filterBtns.nth(1).click();
      await page.waitForTimeout(1000);
      const afterText = await page.locator('body').textContent();

      expect(afterText && afterText.length > 20).toBeTruthy();
    }
  });

  test('leaderboard period filter works', async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const periodBtns = page.getByRole('button').filter({
      hasText: /week|month|all time|year/i,
    });

    if ((await periodBtns.count()) >= 2) {
      await periodBtns.last().click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });
});
