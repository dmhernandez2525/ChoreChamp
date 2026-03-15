import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Enterprise Page', () => {
  test('shows team or organization features', async ({ page }) => {
    await page.goto(`/households/${HID}/enterprise`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Enterprise page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for enterprise/team UI: team member lists, org charts, admin panels, role management
    const teamCards = page.locator('[class*="card"], [class*="team"], [class*="member"], [class*="org"]');
    const managementButtons = page.getByRole('button', { name: /manage|invite|add|create|admin/i });
    const teamLinks = page.getByRole('link', { name: /team|member|role|department/i });
    const enterpriseText = page.getByText(/enterprise|team|organization|department|manage|admin/i).first();
    const settingsSection = page.locator('[class*="setting"], [class*="config"], [class*="admin"]');

    const hasCards = (await teamCards.count()) > 0;
    const hasButtons = (await managementButtons.count()) > 0;
    const hasLinks = (await teamLinks.count()) > 0;
    const hasEnterpriseText = await enterpriseText.isVisible().catch(() => false);
    const hasSettings = (await settingsSection.count()) > 0;

    expect(hasCards || hasButtons || hasLinks || hasEnterpriseText || hasSettings).toBeTruthy();
  });
});

test.describe('Wellness Page', () => {
  test('shows health-related tracking', async ({ page }) => {
    await page.goto(`/households/${HID}/wellness`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Wellness page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for wellness UI: mood trackers, health metrics, activity logs, wellness cards
    const wellnessCards = page.locator('[class*="card"], [class*="wellness"], [class*="health"], [class*="mood"]');
    const trackingButtons = page.getByRole('button', { name: /track|log|record|check.in|submit/i });
    const moodSelectors = page.locator('[class*="mood"], [class*="emoji"], [class*="feeling"]');
    const healthMetrics = page.locator('[class*="metric"], [class*="stat"], [class*="progress"], [class*="chart"]');
    const wellnessText = page.getByText(/wellness|health|mood|well-being|sleep|exercise|water|mindful/i).first();

    const hasCards = (await wellnessCards.count()) > 0;
    const hasTrackingButtons = (await trackingButtons.count()) > 0;
    const hasMoodUI = (await moodSelectors.count()) > 0;
    const hasMetrics = (await healthMetrics.count()) > 0;
    const hasWellnessText = await wellnessText.isVisible().catch(() => false);

    expect(hasCards || hasTrackingButtons || hasMoodUI || hasMetrics || hasWellnessText).toBeTruthy();
  });
});
