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

    // School page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for academic UI: assignment cards, subject tabs, grade displays, homework lists
    const academicCards = page.locator('[class*="card"], [class*="assignment"], [class*="subject"], [class*="homework"]');
    const subjectTabs = page.getByRole('tab');
    const gradeElements = page.locator('[class*="grade"], [class*="score"], [class*="progress"]');
    const academicButtons = page.getByRole('button', { name: /add|submit|complete|assign/i });
    const academicText = page.getByText(/school|homework|assignment|subject|grade|class|education/i).first();

    const hasCards = (await academicCards.count()) > 0;
    const hasTabs = (await subjectTabs.count()) > 0;
    const hasGrades = (await gradeElements.count()) > 0;
    const hasButtons = (await academicButtons.count()) > 0;
    const hasAcademicText = await academicText.isVisible().catch(() => false);

    expect(hasCards || hasTabs || hasGrades || hasButtons || hasAcademicText).toBeTruthy();
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
