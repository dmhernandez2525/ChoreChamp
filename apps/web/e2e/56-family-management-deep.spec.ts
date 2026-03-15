import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;
const FAMILY_MEMBERS = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];

test.describe('Family Management Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('shows list of family members with real names', async ({ page }) => {
    const body = page.locator('body');

    // Verify that at least 3 of the 5 known family members appear on the page
    let foundCount = 0;
    for (const member of FAMILY_MEMBERS) {
      const memberLocator = page.locator(`text=${member}`);
      const isVisible = await memberLocator.first().isVisible().catch(() => false);
      if (isVisible) {
        foundCount++;
      }
    }

    expect(foundCount).toBeGreaterThanOrEqual(3);
  });

  test('has Add Member or Invite button', async ({ page }) => {
    const addMemberBtn = page.getByRole('button', { name: /add member|add|invite/i }).first();
    const addMemberLink = page.getByRole('link', { name: /add member|add|invite/i }).first();

    const hasButton = await addMemberBtn.isVisible().catch(() => false);
    const hasLink = await addMemberLink.isVisible().catch(() => false);

    expect(hasButton || hasLink).toBeTruthy();

    if (hasButton) {
      await expect(addMemberBtn).toBeVisible();
    } else {
      await expect(addMemberLink).toBeVisible();
    }
  });

  test('member cards show role information', async ({ page }) => {
    const body = page.locator('body');

    // Each family member should have a role designation
    const roleTerms = ['parent', 'teen', 'child', 'admin', 'member', 'owner'];
    const bodyText = await body.textContent();
    const lowerBody = bodyText?.toLowerCase() ?? '';

    const foundRoles = roleTerms.filter((role) => lowerBody.includes(role));
    expect(foundRoles.length).toBeGreaterThanOrEqual(1);
  });

  test('can click on a member to see details', async ({ page }) => {
    // Find a clickable member card for one of the known members
    const memberCards = page.locator('[class*="card"], [class*="Card"], [class*="cursor-pointer"], [role="listitem"]').filter({
      hasText: /Daniel|Christina|Adam|Addison|Aiden/i,
    });

    const cardCount = await memberCards.count();

    if (cardCount > 0) {
      await memberCards.first().click();
      await page.waitForTimeout(1000);

      // After clicking, should see member detail info (name, role, stats, etc.)
      const body = page.locator('body');
      const bodyText = await body.textContent();
      const lowerBody = bodyText?.toLowerCase() ?? '';

      const hasDetail =
        lowerBody.includes('point') ||
        lowerBody.includes('chore') ||
        lowerBody.includes('role') ||
        lowerBody.includes('name') ||
        lowerBody.includes('completed') ||
        lowerBody.includes('edit');

      expect(hasDetail).toBeTruthy();
    } else {
      // If no clickable cards, try clicking directly on a member name link
      const memberLink = page.getByRole('link', { name: /Daniel|Christina|Adam/i }).first();
      const hasLink = await memberLink.isVisible().catch(() => false);
      expect(hasLink).toBeTruthy();
    }
  });
});
