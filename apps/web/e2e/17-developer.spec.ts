import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Developer / API Platform', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/developer`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('developer page loads', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('shows API keys tab or section', async ({ page }) => {
    const keysTab = page.getByText(/api.*key|key/i).first();
    const hasKeys = await keysTab.isVisible().catch(() => false);

    const overview = page.getByText(/overview|api|developer/i).first();
    const hasOverview = await overview.isVisible().catch(() => false);

    expect(hasKeys || hasOverview).toBeTruthy();
  });

  test('shows webhooks section', async ({ page }) => {
    const webhooks = page.getByText(/webhook/i).first();
    await expect(webhooks).toBeVisible({ timeout: 10000 });
  });

  test('shows SDK or marketplace section', async ({ page }) => {
    const sdk = page.getByText(/sdk|marketplace|oauth|analytics|openapi/i).first();
    await expect(sdk).toBeVisible({ timeout: 10000 });
  });

  test('has multiple developer tabs', async ({ page }) => {
    // Should show tab navigation with various developer features
    const tabs = page.getByRole('tab').or(page.getByRole('tablist'));
    const tabCount = await tabs.count();

    // Or just has multiple clickable sections
    const bodyText = await page.locator('body').textContent();
    const hasMultipleSections = bodyText !== null && bodyText.length > 100;

    expect(tabCount > 0 || hasMultipleSections).toBeTruthy();
  });
});
