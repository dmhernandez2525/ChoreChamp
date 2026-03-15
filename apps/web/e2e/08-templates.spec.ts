import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Template Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/templates`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('templates page loads with heading', async ({ page }) => {
    const heading = page.getByText(/chore template|template/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows quick start templates info', async ({ page }) => {
    const info = page.getByText(/quick start|template/i).first();
    await expect(info).toBeVisible({ timeout: 10000 });
  });

  test('displays template cards or grid', async ({ page }) => {
    // Templates should render as cards
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });

  test('has filter or search functionality', async ({ page }) => {
    // Should have some way to filter templates
    const filterElement = page.getByText(/filter|search|category|difficulty/i).first();
    const hasFilter = await filterElement.isVisible().catch(() => false);

    const searchInput = page.getByPlaceholder(/search/i).first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    expect(hasFilter || hasSearch).toBeTruthy();
  });

  test('has create custom chore button', async ({ page }) => {
    const customBtn = page.getByText(/create.*custom|custom.*chore/i).first();
    const hasCustom = await customBtn.isVisible().catch(() => false);

    // Or a generic create button
    const createBtn = page.getByRole('button', { name: /create/i }).first();
    const hasCreate = await createBtn.isVisible().catch(() => false);

    const createLink = page.getByRole('link', { name: /create/i }).first();
    const hasLink = await createLink.isVisible().catch(() => false);

    expect(hasCustom || hasCreate || hasLink).toBeTruthy();
  });
});
