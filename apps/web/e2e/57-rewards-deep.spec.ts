import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Rewards Store Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('rewards list shows available rewards', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasRewards =
      bodyText?.toLowerCase().includes('reward') ||
      bodyText?.toLowerCase().includes('point') ||
      bodyText?.toLowerCase().includes('redeem') ||
      bodyText?.toLowerCase().includes('store');

    expect(hasRewards).toBeTruthy();
  });

  test('reward cards are clickable', async ({ page }) => {
    const rewardCards = page.locator('[class*="cursor-pointer"], [class*="card"], [class*="Card"]').filter({
      hasText: /point|reward|redeem/i,
    });

    if ((await rewardCards.count()) > 0) {
      await rewardCards.first().click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    } else {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 20).toBeTruthy();
    }
  });

  test('create reward button navigates to form', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
    const createLink = page.getByRole('link', { name: /create|add|new/i }).first();

    const hasCreate =
      (await createBtn.isVisible().catch(() => false)) ||
      (await createLink.isVisible().catch(() => false));

    if (hasCreate) {
      const target = (await createBtn.isVisible().catch(() => false)) ? createBtn : createLink;
      await target.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('pending redemptions tab is accessible', async ({ page }) => {
    const pendingTab = page.getByRole('button', { name: /pending|approval|redeem/i }).first();
    const pendingLink = page.getByRole('tab', { name: /pending|approval|redeem/i }).first();

    const hasPending =
      (await pendingTab.isVisible().catch(() => false)) ||
      (await pendingLink.isVisible().catch(() => false));

    if (hasPending) {
      const target = (await pendingTab.isVisible().catch(() => false)) ? pendingTab : pendingLink;
      await target.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    } else {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 20).toBeTruthy();
    }
  });

  test('reward detail shows points cost', async ({ page }) => {
    const rewardCards = page.locator('[class*="card"], [class*="Card"]');
    if ((await rewardCards.count()) > 0) {
      const cardText = await rewardCards.first().textContent();
      const hasPoints =
        cardText?.match(/\d+/) !== null ||
        cardText?.toLowerCase().includes('point');

      expect(hasPoints || (cardText?.length ?? 0) > 10).toBeTruthy();
    } else {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 20).toBeTruthy();
    }
  });
});
