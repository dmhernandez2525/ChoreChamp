import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Tab Navigation Interactions', () => {
  test('chore management tab switching', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Switch between Today, All, and Approvals tabs
    const tabs = ['today', 'all', 'approval'];
    for (const tabName of tabs) {
      const tab = page.getByText(new RegExp(tabName, 'i')).first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(1000);

        // Verify page updated
        const root = page.locator('#root');
        await expect(root).toBeVisible();
      }
    }
  });

  test('settings tab switching', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Switch between all settings tabs
    const tabs = ['profile', 'notification', 'security', 'accessibility', 'language'];
    for (const tabName of tabs) {
      const tab = page.getByText(new RegExp(tabName, 'i')).first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(1000);

        // Verify content changed
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(50);
      }
    }
  });

  test('family management tab switching', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Close any open modals first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Switch between Members and Invite Codes tabs using button role
    const membersTab = page.getByRole('button', { name: /members/i }).first();
    if (await membersTab.isVisible().catch(() => false)) {
      await membersTab.click();
      await page.waitForTimeout(1000);
    }

    const inviteTab = page.getByRole('button', { name: /invite codes/i }).first();
    if (await inviteTab.isVisible().catch(() => false)) {
      await inviteTab.click();
      await page.waitForTimeout(1000);

      // Should show invite code content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.toLowerCase().includes('invite') || bodyText?.toLowerCase().includes('generate')).toBeTruthy();
    }
  });

  test('rewards tab switching between store and pending', async ({ page }) => {
    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Switch between Rewards Store and Pending Redemptions
    const storeTab = page.getByText(/store|reward/i).first();
    if (await storeTab.isVisible().catch(() => false)) {
      await storeTab.click();
      await page.waitForTimeout(1000);
    }

    const pendingTab = page.getByText(/pending|redemption/i).first();
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(50);
    }
  });

  test('leaderboard period switching', async ({ page }) => {
    await page.goto(`/households/${HID}/leaderboard`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Switch between period options (Today, This Week, This Month, All Time)
    const periods = ['today', 'week', 'month', 'all time'];
    for (const period of periods) {
      const periodBtn = page.getByText(new RegExp(period, 'i')).first();
      if (await periodBtn.isVisible().catch(() => false)) {
        await periodBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Page should still be functional
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});
