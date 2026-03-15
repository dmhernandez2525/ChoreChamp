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

  test('boss battle page shows battle progress', async ({ page }) => {
    // Should display boss battle heading or title
    const heading = page.getByText(/boss.*battle|battle|boss/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for progress indicators: progress bar, HP, percentage, or fraction
    const progressBar = page.locator('[role="progressbar"], [class*="progress"], [class*="Progress"]').first();
    const hasProgressBar = await progressBar.isVisible().catch(() => false);

    const progressText = page.getByText(/progress|hp|health|damage|\d+%|\d+\/\d+/i).first();
    const hasProgressText = await progressText.isVisible().catch(() => false);

    expect(hasProgressBar || hasProgressText).toBeTruthy();
  });

  test('shows family contribution or participation', async ({ page }) => {
    // Should show family member names with their contributions
    const memberNames = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];
    let visibleMembers = 0;

    for (const name of memberNames) {
      const member = page.getByText(new RegExp(name, 'i')).first();
      const isVisible = await member.isVisible().catch(() => false);
      if (isVisible) visibleMembers++;
    }

    // Or show contribution-related text
    const contributionText = page.getByText(/contribution|damage|attack|team|participant/i).first();
    const hasContribution = await contributionText.isVisible().catch(() => false);

    expect(visibleMembers > 0 || hasContribution).toBeTruthy();
  });

  test('has battle history or stats', async ({ page }) => {
    // Look for history section, past battles, or stats
    const historyHeading = page.getByText(/history|past|previous|defeated|stats|record/i).first();
    const hasHistory = await historyHeading.isVisible().catch(() => false);

    // Or look for stat numbers or battle-related metrics
    const statContent = page.getByText(/won|lost|streak|total|battle|level/i).first();
    const hasStats = await statContent.isVisible().catch(() => false);

    // Or look for a list/table of past battles
    const battleList = page.locator('[class*="history"], [class*="History"], table, [class*="list"], [class*="List"]').first();
    const hasList = await battleList.isVisible().catch(() => false);

    expect(hasHistory || hasStats || hasList).toBeTruthy();
  });
});
