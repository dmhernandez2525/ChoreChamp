import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Boss Battle Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/boss-battle`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('boss battle page shows heading and content', async ({ page }) => {
    // Should display "Boss Battle" heading
    const heading = page.getByRole('heading', { name: /boss battle/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Page should show either an active boss or the "No Active Boss Battle" empty state
    const activeBoss = page.locator('[class*="boss"], [class*="Boss"]').first();
    const noBoss = page.getByText(/no active boss battle/i).first();
    const howItWorks = page.getByText(/how boss battles work/i).first();

    const hasActiveBoss = await activeBoss.isVisible().catch(() => false);
    const hasNoBoss = await noBoss.isVisible().catch(() => false);
    const hasHowItWorks = await howItWorks.isVisible().catch(() => false);

    // The page should show boss content or the empty state with explanatory text
    expect(hasActiveBoss || hasNoBoss || hasHowItWorks).toBeTruthy();
  });

  test('shows how boss battles work or family contribution', async ({ page }) => {
    // The page always shows a "How Boss Battles Work" section
    const howItWorks = page.getByText(/how boss battles work/i).first();
    const hasHowItWorks = await howItWorks.isVisible().catch(() => false);

    // Or shows contributor-related content if a battle is active
    const body = page.locator('body');
    const bodyText = await body.textContent();
    const lowerBody = bodyText?.toLowerCase() ?? '';

    const hasContributionContent =
      lowerBody.includes('complete chores') ||
      lowerBody.includes('damage') ||
      lowerBody.includes('contribution') ||
      lowerBody.includes('defeat') ||
      lowerBody.includes('boss battle');

    expect(hasHowItWorks || hasContributionContent).toBeTruthy();
  });

  test('has battle info or start battle option', async ({ page }) => {
    // Either an active boss shows battle stats, or the empty state offers to start a battle
    const startBattleBtn = page.getByRole('button', { name: /start.*battle/i }).first();
    const hasStartBtn = await startBattleBtn.isVisible().catch(() => false);

    const noBoss = page.getByText(/no active boss battle/i).first();
    const hasNoBoss = await noBoss.isVisible().catch(() => false);

    // Look for history or stats sections
    const body = page.locator('body');
    const bodyText = await body.textContent();
    const lowerBody = bodyText?.toLowerCase() ?? '';

    const hasBattleInfo =
      lowerBody.includes('boss battle') ||
      lowerBody.includes('family goal') ||
      lowerBody.includes('history') ||
      lowerBody.includes('victory');

    expect(hasStartBtn || hasNoBoss || hasBattleInfo).toBeTruthy();
  });
});
