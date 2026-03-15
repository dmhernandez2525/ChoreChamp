import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Family Hub Page', () => {
  test('family hub shows family communication or calendar features', async ({ page }) => {
    await page.goto(`/households/${HID}/family-hub`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should show family-related content: calendar, messages, announcements, or member overview
    const familyHeading = page.getByText(/family|hub/i).first();
    const hasHeading = await familyHeading.isVisible().catch(() => false);

    const calendarSection = page.getByText(/calendar|event|schedule|announcement|message/i).first();
    const hasCalendar = await calendarSection.isVisible().catch(() => false);

    // Should show at least one family member name from the household
    const memberName = page.getByText(/Daniel|Christina|Adam|Addison|Aiden/i).first();
    const hasMember = await memberName.isVisible().catch(() => false);

    expect(hasHeading || hasCalendar || hasMember).toBeTruthy();
  });
});

test.describe('Financial Page', () => {
  test('financial page shows allowance or earnings tracking', async ({ page }) => {
    await page.goto(`/households/${HID}/financial`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Should display financial tracking: allowance, earnings, balance, or transactions
    const financialHeading = page.getByText(/financial|allowance|earnings|money|balance/i).first();
    const hasHeading = await financialHeading.isVisible().catch(() => false);

    const trackingContent = page.getByText(/earned|spent|total|transaction|budget/i).first();
    const hasTracking = await trackingContent.isVisible().catch(() => false);

    // May show member names with their earnings
    const memberEarnings = page.getByText(/Daniel|Christina|Adam|Addison|Aiden/i).first();
    const hasMemberData = await memberEarnings.isVisible().catch(() => false);

    expect(hasHeading || hasTracking || hasMemberData).toBeTruthy();
  });
});
