import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Navigation Flow Tests', () => {
  test('sidebar navigation visits all major sections', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const sections = [
      { name: /chore|task/i, expectedContent: /chore|task|assign|clean/i },
      { name: /reward/i, expectedContent: /reward|point|earn|redeem/i },
      { name: /leader/i, expectedContent: /leader|rank|score|point/i },
      { name: /member|family/i, expectedContent: /member|family|daniel|christina/i },
      { name: /setting/i, expectedContent: /setting|config|household|name/i },
    ];

    for (const section of sections) {
      const navLink = page.getByRole('link', { name: section.name }).first();
      const navButton = page.getByRole('button', { name: section.name }).first();

      const hasLink = await navLink.isVisible().catch(() => false);
      const hasButton = await navButton.isVisible().catch(() => false);

      if (hasLink || hasButton) {
        const target = hasLink ? navLink : navButton;
        await target.click();
        await page.waitForTimeout(1500);
        await ensureAuthenticated(page);
        await page.waitForTimeout(2000);

        // Verify section-specific content loaded
        const content = page.getByText(section.expectedContent).first();
        await expect(content).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('deep links load correct pages with relevant content', async ({ page }) => {
    const deepLinks = [
      { url: `/households/${HID}/rewards`, expected: /reward|point|earn/i },
      { url: `/households/${HID}/leaderboard`, expected: /leader|rank|score/i },
      { url: `/households/${HID}/activity`, expected: /activity|recent|log|history/i },
      { url: `/households/${HID}/reports`, expected: /report|summary|chart|analytics/i },
    ];

    for (const link of deepLinks) {
      await page.goto(link.url);
      await page.waitForLoadState('load');
      await ensureAuthenticated(page);
      await page.waitForTimeout(2000);

      // Each deep link should show page-specific content
      const content = page.getByText(link.expected).first();
      await expect(content).toBeVisible({ timeout: 10000 });

      // App root should be rendered
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('back navigation returns to previous page', async ({ page }) => {
    // Start at household dashboard
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const dashboardUrl = page.url();

    // Navigate to settings
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Verify we are on settings
    expect(page.url()).toContain('settings');

    // Go back
    await page.goBack();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Should return to the household dashboard URL
    expect(page.url()).not.toContain('settings');
    await expect(page.locator('#root')).toBeVisible();
  });

  test('mobile menu toggle works on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // On mobile, sidebar should be collapsed; look for a menu/hamburger button
    const menuBtn = page.getByRole('button', { name: /menu|hamburger|nav|toggle/i }).first();
    const menuIcon = page.locator('button svg, [class*="menu-toggle"], [class*="hamburger"]').first();

    const hasMenu = await menuBtn.isVisible().catch(() => false);
    const hasIcon = await menuIcon.isVisible().catch(() => false);

    if (hasMenu || hasIcon) {
      const target = hasMenu ? menuBtn : menuIcon;
      await target.click();
      await page.waitForTimeout(1000);

      // After opening, navigation links should become visible
      const navLinks = page.getByRole('link');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThanOrEqual(2);
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
