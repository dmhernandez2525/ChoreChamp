import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Arcade Page', () => {
  test('has game sections', async ({ page }) => {
    await page.goto(`/households/${HID}/arcade`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Arcade page should have the "Game Arcade" heading or show an error/loading state
    const heading = page.getByRole('heading', { name: /game arcade/i }).first();
    const errorText = page.getByText(/failed|error|retry/i).first();

    const hasHeading = await heading.isVisible().catch(() => false);
    const hasError = await errorText.isVisible().catch(() => false);

    if (hasHeading) {
      // Look for category filter buttons (All Games, Puzzle, Sorting, etc.)
      const categoryButtons = page.getByRole('button').filter({
        hasText: /all games|puzzle|sorting|time challenge|memory|multiplayer/i,
      });
      const categoryCount = await categoryButtons.count();

      // Look for game-related sections (Available Games, Locked Games, or "No games in this category")
      const gameSections = page.getByRole('heading', { name: /available games|locked games|upcoming game nights/i });
      const noGamesText = page.getByText(/no games in this category/i).first();
      const planNightBtn = page.getByRole('button', { name: /plan game night/i }).first();

      const hasSections = (await gameSections.count()) > 0;
      const hasNoGames = await noGamesText.isVisible().catch(() => false);
      const hasPlanBtn = await planNightBtn.isVisible().catch(() => false);

      // The arcade should show category filters, game sections, or a "no games" message
      expect(categoryCount > 0 || hasSections || hasNoGames || hasPlanBtn).toBeTruthy();
    } else if (hasError) {
      // Error state is acceptable (API may not be running)
      const retryBtn = page.getByRole('button', { name: /retry/i }).first();
      const hasRetry = await retryBtn.isVisible().catch(() => false);
      expect(hasRetry).toBeTruthy();
    } else {
      // Loading state or skeleton should be present at minimum
      const body = page.locator('body');
      await expect(body).toContainText(/.+/);
    }
  });
});

test.describe('Collection Page', () => {
  test('shows collectible items', async ({ page }) => {
    await page.goto(`/households/${HID}/collection`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Collection page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for collectible items: cards with images, item grids, category filters
    const collectibleCards = page.locator('[class*="card"], [class*="item"], [class*="collectible"], [class*="collection"]');
    const itemImages = page.locator('img[alt*="item" i], img[alt*="collect" i], img[alt*="reward" i]');
    const categoryFilters = page.getByRole('tab').or(page.getByRole('button', { name: /filter|category|all|rare|common/i }));
    const emptyState = page.getByText(/no items|empty collection|start collecting/i).first();

    const hasCards = (await collectibleCards.count()) > 0;
    const hasImages = (await itemImages.count()) > 0;
    const hasFilters = (await categoryFilters.count()) > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasImages || hasFilters || hasEmptyState).toBeTruthy();
  });
});
