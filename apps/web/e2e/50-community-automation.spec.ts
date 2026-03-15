import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Community Page', () => {
  test('community page loads with community features', async ({ page }) => {
    await page.goto(`/households/${HID}/community`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Page should display a heading or section related to community features
    const communityHeading = page.getByText(/community/i).first();
    const socialSection = page.getByText(/social|forum|event|share|connect/i).first();

    const hasHeading = await communityHeading.isVisible().catch(() => false);
    const hasSocial = await socialSection.isVisible().catch(() => false);

    expect(hasHeading || hasSocial).toBeTruthy();
  });
});

test.describe('Automation Page', () => {
  test('automation page shows rules or empty state with create button', async ({ page }) => {
    await page.goto(`/households/${HID}/automation`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should show existing automation rules OR an empty state with a way to create one
    const automationHeading = page.getByText(/automation/i).first();
    const hasHeading = await automationHeading.isVisible().catch(() => false);

    const ruleContent = page.getByText(/rule|trigger|schedule|when|then/i).first();
    const hasRules = await ruleContent.isVisible().catch(() => false);

    const createButton = page.getByRole('button', { name: /create|add|new/i }).first();
    const hasCreate = await createButton.isVisible().catch(() => false);

    // Page must show either a heading, existing rules, or a create button
    expect(hasHeading || hasRules || hasCreate).toBeTruthy();
  });
});
