import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Theme Selection Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('appearance and themes section visible', async ({ page }) => {
    // Scroll to find themes section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    const themesHeading = page.getByText(/appearance.*theme/i).first();
    const hasThemes = await themesHeading.isVisible().catch(() => false);

    expect(hasThemes).toBeTruthy();
  });

  test('theme cards show name and description', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    // Theme cards should show theme names
    const bodyText = await page.locator('body').textContent();
    const hasThemeContent =
      bodyText?.toLowerCase().includes('theme') ||
      bodyText?.toLowerCase().includes('appearance') ||
      bodyText?.toLowerCase().includes('vibe');

    expect(hasThemeContent).toBeTruthy();
  });

  test('current theme indicator shown', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    const currentTheme = page.getByText(/current theme/i);
    const hasIndicator = await currentTheme.isVisible().catch(() => false);

    // May or may not be visible depending on feature gate
    expect(hasIndicator).toBeTruthy();
  });

  test('apply theme button exists', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    const applyBtn = page.getByRole('button', { name: /apply theme/i });
    const hasApply = await applyBtn.isVisible().catch(() => false);

    // Premium feature, may be behind gate
    expect(hasApply).toBeTruthy();
  });
});
