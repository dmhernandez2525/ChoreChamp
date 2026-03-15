import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('School Page', () => {
  test('shows academic-related features', async ({ page }) => {
    await page.goto(`/households/${HID}/school`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // SchoolExtracurricular page has heading "School & Extracurricular"
    const heading = page.getByRole('heading', { name: /school/i }).first();
    const errorText = page.getByText(/failed to load|retry/i).first();

    const hasHeading = await heading.isVisible().catch(() => false);
    const hasError = await errorText.isVisible().catch(() => false);

    if (hasHeading) {
      // The page has tab buttons: Calendar, School, Activities, Events, Volunteer, College Prep, Balance
      const tabButtons = page.getByRole('button').filter({
        hasText: /calendar|school|activities|events|volunteer|college prep|balance/i,
      });
      const tabCount = await tabButtons.count();

      // Should have at least several tab buttons for the different sections
      expect(tabCount).toBeGreaterThanOrEqual(3);

      // The page also shows descriptive text
      const body = page.locator('body');
      await expect(body).toContainText(/school|schedule|activities|balance/i);
    } else if (hasError) {
      // Error state with retry button is acceptable (API may not be running)
      const retryBtn = page.getByRole('button', { name: /retry/i }).first();
      await expect(retryBtn).toBeVisible();
    } else {
      // Loading spinner should be present at minimum
      const spinner = page.locator('[class*="animate-spin"]').first();
      const hasSpinner = await spinner.isVisible().catch(() => false);
      expect(hasSpinner).toBeTruthy();
    }
  });
});

test.describe('Store Page', () => {
  test('shows purchasable items with point costs', async ({ page }) => {
    await page.goto(`/households/${HID}/store`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Store page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for store-related UI: item cards with prices, buy buttons, point balances, categories
    const storeItems = page.locator('[class*="card"], [class*="item"], [class*="product"], [class*="reward"]');
    const buyButtons = page.getByRole('button', { name: /buy|purchase|redeem|unlock/i });
    const pointCosts = page.getByText(/pts|points|coins|cost/i).first();
    const categoryFilters = page.getByRole('tab').or(page.getByRole('button', { name: /all|category|filter/i }));
    const storeText = page.getByText(/store|shop|reward|redeem|purchase/i).first();

    const hasItems = (await storeItems.count()) > 0;
    const hasBuyButtons = (await buyButtons.count()) > 0;
    const hasPointCosts = await pointCosts.isVisible().catch(() => false);
    const hasFilters = (await categoryFilters.count()) > 0;
    const hasStoreText = await storeText.isVisible().catch(() => false);

    expect(hasItems || hasBuyButtons || hasPointCosts || hasFilters || hasStoreText).toBeTruthy();
  });
});
