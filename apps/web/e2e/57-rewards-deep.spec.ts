import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Rewards Store Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('rewards page shows reward cards or empty state', async ({ page }) => {
    const body = page.locator('body');

    // Page should show either reward cards or a clear empty state message
    const rewardCards = page.locator('[class*="card"], [class*="Card"], [data-testid*="reward"]').filter({
      hasText: /reward|point|redeem/i,
    });

    const cardCount = await rewardCards.count();

    if (cardCount > 0) {
      // Rewards exist, verify at least one is visible
      await expect(rewardCards.first()).toBeVisible();
    } else {
      // No reward cards, should show an empty state or prompt
      await expect(body).toContainText(/no reward|create.*reward|add.*reward|get started|empty/i);
    }
  });

  test('has Create Reward button', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
    const createLink = page.getByRole('link', { name: /create|add|new/i }).first();

    const hasButton = await createBtn.isVisible().catch(() => false);
    const hasLink = await createLink.isVisible().catch(() => false);

    expect(hasButton || hasLink).toBeTruthy();

    if (hasButton) {
      await expect(createBtn).toBeVisible();
    } else {
      await expect(createLink).toBeVisible();
    }
  });

  test('shows points information', async ({ page }) => {
    const body = page.locator('body');

    // Rewards page should reference points (costs, balances, or earning)
    await expect(body).toContainText(/point|pts|cost|earn/i);
  });
});
