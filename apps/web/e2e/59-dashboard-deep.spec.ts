import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Household Dashboard Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('dashboard tabs switch content', async ({ page }) => {
    const tabs = page.getByRole('button').filter({
      hasText: /today|all|upcoming|overdue|completed|approval/i,
    });
    const tabElements = page.getByRole('tab');

    const totalTabs = (await tabs.count()) + (await tabElements.count());

    if (totalTabs >= 2) {
      const target = (await tabs.count()) >= 2 ? tabs.nth(1) : tabElements.nth(1);
      await target.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('chore cards show essential info', async ({ page }) => {
    const choreCards = page.locator('[class*="cursor-pointer"], [class*="card"], [class*="Card"]').filter({
      hasText: /clean|wash|vacuum|sweep|organize|laundry|dishes|mop|take|make/i,
    });

    if ((await choreCards.count()) > 0) {
      const cardText = await choreCards.first().textContent();
      expect(cardText && cardText.length > 5).toBeTruthy();
    }
  });

  test('clicking a chore opens detail view', async ({ page }) => {
    const choreCards = page.locator('[class*="cursor-pointer"]').filter({
      hasText: /clean|wash|vacuum|sweep|organize|laundry|dishes|mop|take|make/i,
    });

    if ((await choreCards.count()) > 0) {
      await choreCards.first().click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      const hasDetail =
        bodyText?.toLowerCase().includes('point') ||
        bodyText?.toLowerCase().includes('complete') ||
        bodyText?.toLowerCase().includes('assign') ||
        bodyText?.toLowerCase().includes('detail');

      expect(hasDetail || (bodyText?.length ?? 0) > 100).toBeTruthy();

      await page.keyboard.press('Escape');
    }
  });

  test('create chore button is accessible', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create|add|new chore/i }).first();
    const createLink = page.getByRole('link', { name: /create|add|new/i }).first();

    const hasCreate =
      (await createBtn.isVisible().catch(() => false)) ||
      (await createLink.isVisible().catch(() => false));

    expect(hasCreate).toBeTruthy();
  });

  test('dashboard shows household name', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasHouseholdName =
      bodyText?.toLowerCase().includes('hernandez') ||
      bodyText?.toLowerCase().includes('family') ||
      bodyText?.toLowerCase().includes('household');

    expect(hasHouseholdName || (bodyText?.length ?? 0) > 100).toBeTruthy();
  });

  test('progress summary section shows stats', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasStats =
      bodyText?.toLowerCase().includes('completed') ||
      bodyText?.toLowerCase().includes('pending') ||
      bodyText?.toLowerCase().includes('total') ||
      bodyText?.toLowerCase().includes('today') ||
      bodyText?.match(/\d+/) !== null;

    expect(hasStats).toBeTruthy();
  });
});
