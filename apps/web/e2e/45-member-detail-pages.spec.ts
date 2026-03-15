import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Notification Center', () => {
  test('shows notification types or categories', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // The notification page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for notification-related UI elements: list items, cards, tabs, or empty state
    const notificationItems = page.locator('[class*="notification"], [class*="alert"], [role="listitem"], [class*="card"]');
    const tabs = page.getByRole('tab');
    const emptyState = page.getByText(/no notification|all caught up|empty/i).first();

    const hasItems = (await notificationItems.count()) > 0;
    const hasTabs = (await tabs.count()) > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // At least one of these UI patterns should be present
    expect(hasItems || hasTabs || hasEmptyState).toBeTruthy();
  });
});

test.describe('Analytics Page', () => {
  test('shows charts or data sections', async ({ page }) => {
    await page.goto(`/households/${HID}/analytics`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Analytics page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for chart containers, data visualizations, stat cards, or summary sections
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="graph"], [class*="stat"], [class*="metric"]');
    const dataSections = page.locator('[class*="card"], [class*="section"], [class*="panel"]');
    const dataLabels = page.getByText(/total|completed|average|progress|points|streak/i).first();

    const hasCharts = (await charts.count()) > 0;
    const hasDataSections = (await dataSections.count()) > 0;
    const hasDataLabels = await dataLabels.isVisible().catch(() => false);

    // Should have at least one analytics UI element
    expect(hasCharts || hasDataSections || hasDataLabels).toBeTruthy();
  });
});

test.describe('Support Page', () => {
  test('shows contact or help options', async ({ page }) => {
    await page.goto(`/households/${HID}/support`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Support page should have a heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Look for support-related UI: FAQ sections, contact info, help links, form fields
    const supportLinks = page.getByRole('link', { name: /help|faq|contact|email|documentation/i });
    const supportButtons = page.getByRole('button', { name: /submit|send|contact|help/i });
    const supportSections = page.locator('[class*="faq"], [class*="help"], [class*="support"], [class*="contact"]');
    const supportText = page.getByText(/support|help|contact|frequently asked|get in touch/i).first();

    const hasLinks = (await supportLinks.count()) > 0;
    const hasButtons = (await supportButtons.count()) > 0;
    const hasSections = (await supportSections.count()) > 0;
    const hasText = await supportText.isVisible().catch(() => false);

    expect(hasLinks || hasButtons || hasSections || hasText).toBeTruthy();
  });
});
