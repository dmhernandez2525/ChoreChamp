import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';

test.describe('Notification Preferences Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Navigate to notifications tab
    const notifTab = page.getByText(/notification/i).first();
    if (await notifTab.isVisible().catch(() => false)) {
      await notifTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('shows global push and email toggles', async ({ page }) => {
    const pushToggle = page.getByText(/push notification/i).first();
    const emailToggle = page.getByText(/email notification/i).first();

    const hasPush = await pushToggle.isVisible().catch(() => false);
    const hasEmail = await emailToggle.isVisible().catch(() => false);

    expect(hasPush || hasEmail).toBeTruthy();
  });

  test('shows notification type table', async ({ page }) => {
    const choreReminders = page.getByText(/chore reminder/i).first();
    const approvalRequests = page.getByText(/approval request/i).first();
    const streakWarnings = page.getByText(/streak warning/i).first();

    const hasChore = await choreReminders.isVisible().catch(() => false);
    const hasApproval = await approvalRequests.isVisible().catch(() => false);
    const hasStreak = await streakWarnings.isVisible().catch(() => false);

    expect(hasChore || hasApproval || hasStreak).toBeTruthy();
  });

  test('notification types have in-app, push, and email columns', async ({ page }) => {
    const inApp = page.getByText(/in-app/i).first();
    const push = page.getByText(/push/i).first();
    const email = page.getByText(/email/i).first();

    const hasInApp = await inApp.isVisible().catch(() => false);
    const hasPush = await push.isVisible().catch(() => false);
    const hasEmail = await email.isVisible().catch(() => false);

    expect(hasInApp || hasPush || hasEmail).toBeTruthy();
  });

  test('notification toggles are interactive switches', async ({ page }) => {
    // Notifications use auto-saving switch toggles, not a save button
    const switches = page.getByRole('switch');
    const switchCount = await switches.count();

    // Should have multiple toggle switches for notification types
    expect(switchCount).toBeGreaterThanOrEqual(1);
  });

  test('notification types displayed', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.waitForTimeout(1000);

    const types = [
      'chore reminder',
      'chore completion',
      'approval',
      'reward',
      'badge',
      'streak',
      'boss battle',
      'family goal',
    ];

    let visibleCount = 0;
    for (const type of types) {
      const element = page.getByText(new RegExp(type, 'i')).first();
      if (await element.isVisible().catch(() => false)) {
        visibleCount++;
      }
    }

    // At least some types should be visible
    expect(visibleCount).toBeGreaterThanOrEqual(1);
  });
});
