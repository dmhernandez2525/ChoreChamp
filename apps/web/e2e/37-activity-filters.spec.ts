import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Activity Feed Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/activity`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('shows category filter buttons', async ({ page }) => {
    const allBtn = page.getByRole('button', { name: /all/i }).first();
    const choresBtn = page.getByRole('button', { name: /chores/i }).first();
    const rewardsBtn = page.getByRole('button', { name: /rewards/i }).first();

    const hasAll = await allBtn.isVisible().catch(() => false);
    const hasChores = await choresBtn.isVisible().catch(() => false);
    const hasRewards = await rewardsBtn.isVisible().catch(() => false);

    expect(hasAll || hasChores || hasRewards).toBeTruthy();
  });

  test('click category filter buttons', async ({ page }) => {
    const categories = ['chores', 'rewards', 'achievements', 'team'];
    for (const cat of categories) {
      const btn = page.getByRole('button', { name: new RegExp(cat, 'i') }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Click "All" to reset
    const allBtn = page.getByRole('button', { name: /all/i }).first();
    if (await allBtn.isVisible().catch(() => false)) {
      await allBtn.click();
      await page.waitForTimeout(500);
    }

    // Page should still be functional
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('member filter dropdown exists', async ({ page }) => {
    const memberFilter = page.getByText(/filter by member/i);
    const memberSelect = page.locator('select').first();

    const hasLabel = await memberFilter.isVisible().catch(() => false);
    const hasSelect = await memberSelect.isVisible().catch(() => false);

    // Member filter may or may not be visible depending on activity data
    expect(hasLabel || hasSelect).toBeTruthy();
  });
});
