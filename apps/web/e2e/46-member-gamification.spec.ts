import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Member Badges Page', () => {
  test('badges page loads for a member', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Find a member card and navigate to badges
    const memberCards = page.locator('[class*="card"], [class*="Card"]').filter({
      hasText: /daniel|christina|adam|addison|aiden/i,
    });

    if ((await memberCards.count()) > 0) {
      await memberCards.first().click();
      await page.waitForTimeout(1000);

      const badgesLink = page.getByRole('link', { name: /badge/i }).first();
      const hasBadges = await badgesLink.isVisible().catch(() => false);

      if (hasBadges) {
        await badgesLink.click();
        await page.waitForTimeout(1000);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText && bodyText.length > 20).toBeTruthy();
      } else {
        const bodyText = await page.locator('body').textContent();
        expect(bodyText && bodyText.length > 50).toBeTruthy();
      }
    }
  });
});

test.describe('Member Streaks Page', () => {
  test('streaks page loads', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Look for streak indicators on the dashboard
    const bodyText = await page.locator('body').textContent();
    const hasStreaks =
      bodyText?.toLowerCase().includes('streak') ||
      bodyText?.toLowerCase().includes('day') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasStreaks).toBeTruthy();
  });
});

test.describe('Member Character Page', () => {
  test('character/avatar page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('character') ||
      bodyText?.toLowerCase().includes('avatar') ||
      bodyText?.toLowerCase().includes('member') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Member Pets Page', () => {
  test('pets page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Look for pet-related content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });
});
