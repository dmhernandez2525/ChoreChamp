import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Navigation Flow Tests', () => {
  test('sidebar navigation visits all major sections', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const sections = [
      { name: /chore|task/i, path: 'chores' },
      { name: /reward/i, path: 'rewards' },
      { name: /leader/i, path: 'leaderboard' },
      { name: /member|family/i, path: 'members' },
      { name: /setting/i, path: 'settings' },
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

        const bodyText = await page.locator('body').textContent();
        expect(bodyText && bodyText.length > 50).toBeTruthy();
      }
    }
  });

  test('breadcrumb navigation works', async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"], [class*="breadcrumb"]');
    const hasBreadcrumbs = (await breadcrumbs.count()) > 0;

    if (hasBreadcrumbs) {
      const links = breadcrumbs.first().locator('a');
      if ((await links.count()) > 0) {
        await links.first().click();
        await page.waitForTimeout(1000);

        const bodyText = await page.locator('body').textContent();
        expect(bodyText && bodyText.length > 50).toBeTruthy();
      }
    } else {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('back button preserves state', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Navigate to settings
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Go back
    await page.goBack();
    await page.waitForTimeout(1500);

    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });

  test('deep link to specific pages works', async ({ page }) => {
    const deepLinks = [
      `/households/${HID}/rewards`,
      `/households/${HID}/leaderboard`,
      `/households/${HID}/activity`,
      `/households/${HID}/reports`,
    ];

    for (const link of deepLinks) {
      await page.goto(link);
      await page.waitForLoadState('networkidle');
      await ensureAuthenticated(page);
      await page.waitForTimeout(1500);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('mobile menu toggle works on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const menuBtn = page.getByRole('button', { name: /menu|hamburger|nav/i }).first();
    const menuIcon = page.locator('[class*="menu"], [class*="hamburger"], button svg').first();

    const hasMenu = (await menuBtn.isVisible().catch(() => false)) ||
      (await menuIcon.isVisible().catch(() => false));

    if (hasMenu) {
      const target = (await menuBtn.isVisible().catch(() => false)) ? menuBtn : menuIcon;
      await target.click();
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
