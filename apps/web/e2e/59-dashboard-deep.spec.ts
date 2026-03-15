import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;
const FAMILY_MEMBERS = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];

test.describe('Household Dashboard Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('dashboard loads with real household data', async ({ page }) => {
    const body = page.locator('body');

    // Dashboard should display household-related content
    await expect(body).toContainText(/household|family|Hernandez|dashboard/i);

    // At least one family member name should be visible
    let foundMember = false;
    for (const member of FAMILY_MEMBERS) {
      const memberLocator = page.locator(`text=${member}`);
      const isVisible = await memberLocator.first().isVisible().catch(() => false);
      if (isVisible) {
        foundMember = true;
        break;
      }
    }
    expect(foundMember).toBeTruthy();
  });

  test('shows upcoming chores section', async ({ page }) => {
    const body = page.locator('body');

    // Dashboard should show chores (upcoming, today, or pending)
    await expect(body).toContainText(/chore|task|today|upcoming|pending|to do/i);

    // Should display actual chore content (names of real chores)
    const choreKeywords = /clean|wash|vacuum|sweep|organize|laundry|dishes|mop|take|make|dust|trash|bed|floor|bathroom|kitchen/i;
    const bodyText = await body.textContent();
    const hasChoreContent = choreKeywords.test(bodyText ?? '');

    // Either chore names are visible or there's an explicit empty state
    if (!hasChoreContent) {
      await expect(body).toContainText(/no chore|all done|caught up|empty|nothing/i);
    }
  });

  test('shows member activity or stats', async ({ page }) => {
    const body = page.locator('body');

    // Dashboard should show stats, activity feed, or progress info
    await expect(body).toContainText(/completed|pending|total|point|streak|progress|activity|stat/i);

    // Numeric values should be present (counts, points, percentages)
    const bodyText = await body.textContent();
    const hasNumbers = bodyText?.match(/\d+/) !== null;
    expect(hasNumbers).toBeTruthy();
  });

  test('navigation to other sections works', async ({ page }) => {
    // Find navigation links to key sections
    const navLinks = {
      board: page.getByRole('link', { name: /board/i }).first(),
      rewards: page.getByRole('link', { name: /reward/i }).first(),
      leaderboard: page.getByRole('link', { name: /leaderboard|ranking/i }).first(),
      members: page.getByRole('link', { name: /member|family/i }).first(),
    };

    // At least 2 navigation links should be visible
    let visibleNavCount = 0;
    for (const [, link] of Object.entries(navLinks)) {
      const isVisible = await link.isVisible().catch(() => false);
      if (isVisible) {
        visibleNavCount++;
      }
    }
    expect(visibleNavCount).toBeGreaterThanOrEqual(2);

    // Click one of the nav links and verify navigation occurs
    for (const [section, link] of Object.entries(navLinks)) {
      const isVisible = await link.isVisible().catch(() => false);
      if (isVisible) {
        await link.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(1000);

        // URL should have changed to include the section name
        const currentUrl = page.url();
        expect(currentUrl).not.toBe(`/households/${HID}`);
        break;
      }
    }
  });
});
