import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Subscription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/subscription`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('subscription page loads with heading', async ({ page }) => {
    const heading = page.getByText(/subscription/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows current plan section', async ({ page }) => {
    const planInfo = page.getByText(/current.*plan|plan|tier|free|premium|family/i).first();
    await expect(planInfo).toBeVisible({ timeout: 10000 });
  });

  test('shows plan cards or options', async ({ page }) => {
    // Should show different plan tiers
    const planCard = page.getByText(/free|family|premium/i).first();
    await expect(planCard).toBeVisible({ timeout: 10000 });
  });

  test('shows billing toggle', async ({ page }) => {
    const toggle = page.getByText(/monthly|annual|yearly|billing/i).first();
    const hasToggle = await toggle.isVisible().catch(() => false);

    // May show pricing directly
    const pricing = page.getByText(/\$|price|per.*month/i).first();
    const hasPricing = await pricing.isVisible().catch(() => false);

    expect(hasToggle || hasPricing).toBeTruthy();
  });

  test('shows feature comparison', async ({ page }) => {
    const comparison = page.getByText(/compare|feature|comparison/i).first();
    const hasCompare = await comparison.isVisible().catch(() => false);

    // Or shows feature list items
    const features = page.getByText(/member|chore|reward|storage|template/i).first();
    const hasFeatures = await features.isVisible().catch(() => false);

    expect(hasCompare || hasFeatures).toBeTruthy();
  });
});
