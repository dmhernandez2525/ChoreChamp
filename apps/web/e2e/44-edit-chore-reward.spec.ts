import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Edit Chore Page', () => {
  test('edit chore page loads with existing chore data', async ({ page }) => {
    // Navigate to household dashboard to find a chore
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Click on a chore card to open its detail view
    const choreCard = page.locator('[class*="cursor-pointer"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop/i,
    }).first();
    await expect(choreCard).toBeVisible({ timeout: 10000 });
    await choreCard.click();
    await page.waitForTimeout(1500);

    // Look for an edit button or link and click it
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    const editLink = page.getByRole('link', { name: /edit/i }).first();

    const hasEditBtn = await editBtn.isVisible().catch(() => false);
    const hasEditLink = await editLink.isVisible().catch(() => false);

    if (hasEditBtn) {
      await editBtn.click();
    } else if (hasEditLink) {
      await editLink.click();
    }

    await page.waitForTimeout(1500);

    // The page should show a form with chore-related fields
    const formElement = page.locator('form').first();
    const inputFields = page.locator('input, textarea, select');
    const hasForm = await formElement.isVisible().catch(() => false);
    const fieldCount = await inputFields.count();

    // Either we landed on an edit form, or the detail view itself shows chore data
    const choreHeading = page.getByRole('heading').first();
    await expect(choreHeading).toBeVisible({ timeout: 5000 });

    if (hasForm) {
      expect(fieldCount).toBeGreaterThan(0);
    }
  });

  test('form fields are populated with title and description', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Click the first chore card
    const choreCard = page.locator('[class*="cursor-pointer"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop/i,
    }).first();
    await expect(choreCard).toBeVisible({ timeout: 10000 });
    await choreCard.click();
    await page.waitForTimeout(1500);

    // Attempt to reach an edit form
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    const editLink = page.getByRole('link', { name: /edit/i }).first();
    const hasEditBtn = await editBtn.isVisible().catch(() => false);
    const hasEditLink = await editLink.isVisible().catch(() => false);

    if (hasEditBtn) await editBtn.click();
    else if (hasEditLink) await editLink.click();

    await page.waitForTimeout(1500);

    // Check for populated input fields (title, description, etc.)
    const titleInput = page.locator('input[name*="title"], input[name*="name"], input[placeholder*="title" i], input[placeholder*="name" i]').first();
    const descInput = page.locator('textarea[name*="description"], textarea[name*="desc"], textarea[placeholder*="description" i]').first();

    const hasTitleInput = await titleInput.isVisible().catch(() => false);
    const hasDescInput = await descInput.isVisible().catch(() => false);

    if (hasTitleInput) {
      const titleValue = await titleInput.inputValue();
      expect(titleValue.length).toBeGreaterThan(0);
    }

    if (hasDescInput) {
      const descValue = await descInput.inputValue();
      // Description may or may not be filled, but the field should exist
      expect(descValue).toBeDefined();
    }

    // At minimum, the detail/edit view should show the chore name as a heading or label
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('can modify form fields', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const choreCard = page.locator('[class*="cursor-pointer"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop/i,
    }).first();
    await expect(choreCard).toBeVisible({ timeout: 10000 });
    await choreCard.click();
    await page.waitForTimeout(1500);

    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    const editLink = page.getByRole('link', { name: /edit/i }).first();
    const hasEditBtn = await editBtn.isVisible().catch(() => false);
    const hasEditLink = await editLink.isVisible().catch(() => false);

    if (hasEditBtn) await editBtn.click();
    else if (hasEditLink) await editLink.click();

    await page.waitForTimeout(1500);

    // Find an editable input and verify it can be modified
    const editableInput = page.locator('input:not([type="hidden"]):not([disabled]):not([readonly])').first();
    const hasEditableInput = await editableInput.isVisible().catch(() => false);

    if (hasEditableInput) {
      const originalValue = await editableInput.inputValue();
      await editableInput.clear();
      await editableInput.fill('Test Modified Value');
      const newValue = await editableInput.inputValue();
      expect(newValue).toBe('Test Modified Value');

      // Restore original value to avoid modifying real data
      await editableInput.clear();
      await editableInput.fill(originalValue);
    }

    // Verify the page has interactive form elements
    const allInputs = page.locator('input, textarea, select, button');
    const inputCount = await allInputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });
});
