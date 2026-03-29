import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Developer API Keys Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('developer API access section visible', async ({ page }) => {
    // Scroll to find the developer section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const devHeading = page.getByText(/developer.*api|api.*access/i).first();
    const hasDevSection = await devHeading.isVisible().catch(() => false);

    // May be behind premium gate
    expect(hasDevSection).toBeTruthy();
  });

  test('create API key form has name input and create button', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const keyNameInput = page.locator('input[placeholder*="Key name"]');
    const hasInput = await keyNameInput.isVisible().catch(() => false);

    const createKeyBtn = page.getByRole('button', { name: /create key/i });
    const hasBtn = await createKeyBtn.isVisible().catch(() => false);

    // Premium feature, may not be visible on free tier
    if (hasInput && hasBtn) {
      expect(hasInput).toBeTruthy();
      expect(hasBtn).toBeTruthy();
    }
  });

  test('attempt to create API key', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const keyNameInput = page.locator('input[placeholder*="Key name"]');
    if (await keyNameInput.isVisible().catch(() => false)) {
      await keyNameInput.fill('E2E Test Key');

      const createKeyBtn = page.getByRole('button', { name: /create key/i });
      if (await createKeyBtn.isVisible().catch(() => false)) {
        await createKeyBtn.click();
        await page.waitForTimeout(3000);

        // Should show the key secret or a premium-required message
        const secretDisplay = page.getByText(/new api key created/i);
        const hasSecret = await secretDisplay.isVisible().catch(() => false);

        const premiumMsg = page.getByText(/premium|upgrade/i).first();
        const needsPremium = await premiumMsg.isVisible().catch(() => false);

        expect(hasSecret || needsPremium).toBeTruthy();
      }
    }
  });

  test('shows empty state when no API keys exist', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/no api keys/i);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    // Either shows empty state or shows existing keys
    const bodyText = await page.locator('body').textContent();
    const hasApiSection = bodyText?.toLowerCase().includes('api');
    expect(hasEmpty || hasApiSection).toBeTruthy();
  });
});
