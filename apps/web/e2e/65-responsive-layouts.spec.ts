import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Responsive Layout Tests', () => {
  test('mobile viewport shows mobile-friendly layout without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // App root should render
    await expect(page.locator('#root')).toBeVisible();

    // No horizontal scrollbar on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);

    // On mobile, the full sidebar should be hidden (collapsed or off-screen)
    const sidebar = page.locator('aside, nav[class*="sidebar"], [class*="sidebar"]').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    // If sidebar is present, it should be narrow or a hamburger menu should exist
    if (sidebarVisible) {
      const sidebarBox = await sidebar.boundingBox();
      // Sidebar should not take more than half the mobile screen width
      if (sidebarBox) {
        expect(sidebarBox.width).toBeLessThan(200);
      }
    }

    // Should have a menu toggle button on mobile
    const menuToggle = page.locator('button[aria-label*="menu" i], button[aria-label*="nav" i], [class*="hamburger"], [class*="menu-toggle"]').first();
    const hasMenuToggle = await menuToggle.isVisible().catch(() => false);

    // Either sidebar is hidden or a menu toggle exists
    expect(!sidebarVisible || hasMenuToggle).toBeTruthy();
  });

  test('tablet viewport adjusts layout appropriately', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('#root')).toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);

    // Page should render meaningful content (chore cards, member names, stats)
    const contentElements = page.locator('[class*="card"], [class*="stat"], [role="listitem"], [class*="chore"]');
    const contentCount = await contentElements.count();
    expect(contentCount).toBeGreaterThanOrEqual(1);
  });

  test('desktop shows full sidebar navigation with multiple links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('#root')).toBeVisible();

    // Desktop should show the full sidebar with navigation links
    const navLinks = page.getByRole('link');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(3);

    // Sidebar or main nav should be visible at desktop width
    const sidebar = page.locator('aside, nav, [class*="sidebar"], [class*="nav"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('settings page renders correctly across viewports', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`/households/${HID}/settings`);
      await page.waitForLoadState('load');
      await ensureAuthenticated(page);
      await page.waitForTimeout(2000);

      // Settings content should be visible at every viewport
      const settingsContent = page.getByText(/setting/i).first();
      await expect(settingsContent).toBeVisible({ timeout: 10000 });

      // No horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
    }
  });
});
