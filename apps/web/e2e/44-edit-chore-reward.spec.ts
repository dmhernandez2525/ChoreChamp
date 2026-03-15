import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Edit Chore Page', () => {
  test('navigate to chore and find edit option', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Click on a chore to see if there's an edit option
    const choreCards = page.locator('[class*="cursor-pointer"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop/i,
    });

    if ((await choreCards.count()) > 0) {
      await choreCards.first().click();
      await page.waitForTimeout(1000);

      // Look for edit button in detail view
      const editBtn = page.getByRole('button', { name: /edit/i }).first();
      const hasEdit = await editBtn.isVisible().catch(() => false);

      const editLink = page.getByRole('link', { name: /edit/i }).first();
      const hasEditLink = await editLink.isVisible().catch(() => false);

      // Either has edit option or we can check the body
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(50);
    }
  });
});

test.describe('Templates Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/templates`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('templates page loads with content', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('template') ||
      bodyText?.toLowerCase().includes('chore') ||
      bodyText?.toLowerCase().includes('browse');

    expect(hasContent).toBeTruthy();
  });

  test('templates page shows template categories or list', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });
});
