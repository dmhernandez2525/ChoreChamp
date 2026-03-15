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

    // Arcade page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for game-related UI: game cards, play buttons, game categories, or coming soon state
    const gameCards = page.locator('[class*="game"], [class*="card"], [class*="arcade"]');
    const playButtons = page.getByRole('button', { name: /play|start|launch/i });
    const gameLinks = page.getByRole('link', { name: /play|game/i });
    const comingSoon = page.getByText(/coming soon|unlock|no games/i).first();

    const hasGameCards = (await gameCards.count()) > 0;
    const hasPlayButtons = (await playButtons.count()) > 0;
    const hasGameLinks = (await gameLinks.count()) > 0;
    const hasComingSoon = await comingSoon.isVisible().catch(() => false);

    // The arcade page should show games, play options, or a coming-soon state
    expect(hasGameCards || hasPlayButtons || hasGameLinks || hasComingSoon).toBeTruthy();
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
