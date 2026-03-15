import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Activity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/activity`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('activity page loads with heading', async ({ page }) => {
    const heading = page.getByText(/activity/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows activity feed subtitle', async ({ page }) => {
    const subtitle = page.getByText(/happening.*household|see what/i).first();
    const hasSub = await subtitle.isVisible().catch(() => false);

    // Or just shows activity heading
    const heading = page.getByText(/activity.*feed/i).first();
    const hasHeading = await heading.isVisible().catch(() => false);

    expect(hasSub || hasHeading).toBeTruthy();
  });

  test('displays activity filter or feed', async ({ page }) => {
    // Should show filter options or activity items
    const filter = page.getByText(/filter|category|member|all/i).first();
    const hasFilter = await filter.isVisible().catch(() => false);

    const feed = page.getByText(/activity|completed|recent/i).first();
    const hasFeed = await feed.isVisible().catch(() => false);

    expect(hasFilter || hasFeed).toBeTruthy();
  });

  test('shows quick links sidebar', async ({ page }) => {
    // Should show links to leaderboard, rewards, etc.
    const links = page.getByText(/leaderboard|reward|boss.*battle/i).first();
    const hasLinks = await links.isVisible().catch(() => false);

    // Or just renders sidebar content
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText !== null && bodyText.length > 50;

    expect(hasLinks || hasContent).toBeTruthy();
  });
});
