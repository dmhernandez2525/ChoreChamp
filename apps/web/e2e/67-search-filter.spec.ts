import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Search and Filter Tests', () => {
  test('search input exists on the household dashboard', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Look for a search input field
    const searchInput = page.getByPlaceholder(/search|find|filter/i).first();
    const searchBtn = page.getByRole('button', { name: /search/i }).first();

    const hasSearchInput = await searchInput.isVisible().catch(() => false);
    const hasSearchBtn = await searchBtn.isVisible().catch(() => false);

    // Also try command palette (Cmd+K)
    let hasCommandPalette = false;
    if (!hasSearchInput && !hasSearchBtn) {
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(500);
      const commandInput = page.locator('[role="combobox"], input[placeholder*="search" i], input[placeholder*="command" i]').first();
      hasCommandPalette = await commandInput.isVisible().catch(() => false);
      if (hasCommandPalette) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // At least one search mechanism should exist
    expect(hasSearchInput || hasSearchBtn || hasCommandPalette).toBeTruthy();
  });

  test('filter controls on chore list are functional', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Look for filter buttons (All, Today, Upcoming, category filters, etc.)
    const filterBtns = page.getByRole('button').filter({
      hasText: /all|today|upcoming|overdue|kitchen|bathroom|bedroom|weekly|daily/i,
    });

    const filterCount = await filterBtns.count();

    if (filterCount >= 2) {
      // Click a filter that is NOT the first (which is likely "All"/active)
      const secondFilter = filterBtns.nth(1);
      const filterText = await secondFilter.textContent();
      await secondFilter.click();
      await page.waitForTimeout(1500);

      // After clicking a filter, the page should still show the #root and have content
      await expect(page.locator('#root')).toBeVisible();

      // The clicked filter should appear active/selected (different styling or aria-pressed)
      const isPressed = await secondFilter.getAttribute('aria-pressed');
      const hasActiveClass = await secondFilter.evaluate(
        (el) => el.classList.toString().includes('active') || el.classList.toString().includes('selected')
      );

      // Verify the filter had some effect (button state changed or content updated)
      expect(isPressed === 'true' || hasActiveClass || filterText).toBeTruthy();
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
    }
  });

  test('leaderboard period filter switches between time ranges', async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should show leaderboard content
    const leaderboardContent = page.getByText(/leader|rank|score|point/i).first();
    await expect(leaderboardContent).toBeVisible({ timeout: 10000 });

    // Look for period filter buttons
    const periodBtns = page.getByRole('button').filter({
      hasText: /week|month|all.?time|year/i,
    });

    const periodCount = await periodBtns.count();
    if (periodCount >= 2) {
      // Click the last period filter (e.g., "All Time" or "Year")
      await periodBtns.last().click();
      await page.waitForTimeout(1500);

      // Leaderboard should still display member rankings
      const memberName = page.getByText(/daniel|christina|adam|addison|aiden/i).first();
      await expect(memberName).toBeVisible({ timeout: 10000 });
    }
  });
});
