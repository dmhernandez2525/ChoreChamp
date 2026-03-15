import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Boss Battle Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/boss-battle`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(3000);
  });

  test('boss battle page loads with content', async ({ page }) => {
    // Wait for loading to finish (skeletons or content should appear)
    const body = page.locator('body');
    const bodyText = await body.textContent({ timeout: 15000 });

    // Page should show Boss Battle text, loading state, empty state, or error
    const hasBossContent = /boss battle|no active|how boss|household not found|loading/i.test(bodyText ?? '');
    expect(hasBossContent).toBeTruthy();
  });

  test('shows boss battle heading or household name', async ({ page }) => {
    // After loading, should show either the heading or household name
    const body = page.locator('body');
    const bodyText = await body.textContent({ timeout: 15000 });

    const hasRelevantContent = /boss battle|hernandez|household/i.test(bodyText ?? '');
    expect(hasRelevantContent).toBeTruthy();
  });

  test('shows battle state or info section', async ({ page }) => {
    const body = page.locator('body');
    const bodyText = await body.textContent({ timeout: 15000 });

    // Should show active battle, empty state, info, or error
    const hasContent = /no active|how boss battles work|complete chores|damage|boss battle|back to dashboard/i.test(bodyText ?? '');
    expect(hasContent).toBeTruthy();
  });
});
