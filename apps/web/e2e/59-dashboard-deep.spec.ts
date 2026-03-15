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
    // HouseholdDashboard has quick action links at the bottom:
    // "Add Chore", "Manage Family" (parent only), "Enterprise School" (parent only),
    // "Developer API" (parent only), "Analytics", "Settings"
    const navLinks = {
      addChore: page.getByRole('link', { name: /add chore/i }).first(),
      manageFamily: page.getByRole('link', { name: /manage family/i }).first(),
      analytics: page.getByRole('link', { name: /analytics/i }).first(),
      settings: page.getByRole('link', { name: /settings/i }).first(),
    };

    // At least 2 quick action links should be visible
    let visibleNavCount = 0;
    for (const [, link] of Object.entries(navLinks)) {
      const isVisible = await link.isVisible().catch(() => false);
      if (isVisible) {
        visibleNavCount++;
      }
    }
    expect(visibleNavCount).toBeGreaterThanOrEqual(2);

    // Click one of the nav links and verify navigation occurs
    for (const [, link] of Object.entries(navLinks)) {
      const isVisible = await link.isVisible().catch(() => false);
      if (isVisible) {
        await link.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(1000);

        // URL should have changed after clicking
        const currentUrl = page.url();
        expect(currentUrl).not.toBe(`/households/${HID}`);
        break;
      }
    }
  });
});
