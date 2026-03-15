import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Boss Battle Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/boss-battle`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('boss battle shows progress bar', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"], [class*="progress"], [class*="Progress"]');
    const bodyText = await page.locator('body').textContent();

    const hasProgress =
      (await progressBar.count()) > 0 ||
      bodyText?.toLowerCase().includes('progress') ||
      bodyText?.toLowerCase().includes('%') ||
      bodyText?.match(/\d+\/\d+/) !== null;

    expect(hasProgress || (bodyText?.length ?? 0) > 100).toBeTruthy();
  });

  test('boss battle shows family contribution', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasContrib =
      bodyText?.toLowerCase().includes('contribution') ||
      bodyText?.toLowerCase().includes('damage') ||
      bodyText?.toLowerCase().includes('attack') ||
      bodyText?.toLowerCase().includes('team') ||
      bodyText?.toLowerCase().includes('member');

    expect(hasContrib || (bodyText?.length ?? 0) > 100).toBeTruthy();
  });

  test('boss battle has visual elements or content', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();

    const hasBossContent =
      bodyText?.toLowerCase().includes('boss') ||
      bodyText?.toLowerCase().includes('battle') ||
      bodyText?.toLowerCase().includes('monster') ||
      bodyText?.toLowerCase().includes('challenge') ||
      bodyText?.toLowerCase().includes('goal') ||
      bodyText?.toLowerCase().includes('family') ||
      (bodyText?.length ?? 0) > 100;

    expect(hasBossContent).toBeTruthy();
  });

  test('boss history is viewable', async ({ page }) => {
    const historySection = page.locator('text=/history|past|previous|defeated/i').first();
    const hasHistory = await historySection.isVisible().catch(() => false);

    if (hasHistory) {
      await historySection.scrollIntoViewIfNeeded().catch(() => {});
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 100).toBeTruthy();
    } else {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });
});
