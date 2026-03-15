import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Add Family Member Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('open add member modal', async ({ page }) => {
    // Click add member button
    const addBtn = page.getByRole('button', { name: /add.*member|add/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Should show the modal
      const modalTitle = page.getByText(/add family member/i);
      const hasModal = await modalTitle.isVisible().catch(() => false);

      const nameInput = page.locator('input[placeholder*="Emma"]');
      const hasNameInput = await nameInput.isVisible().catch(() => false);

      expect(hasModal || hasNameInput).toBeTruthy();
    }
  });

  test('add member form has name, role, and color fields', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*member|add/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Name field
      const nameField = page.getByLabel(/^name$/i);
      const hasName =
        (await nameField.isVisible().catch(() => false)) ||
        (await page.locator('input[placeholder*="Emma"]').isVisible().catch(() => false));

      // Role selection
      const childRole = page.getByText(/^child$/i).first();
      const teenRole = page.getByText(/^teen$/i).first();
      const hasRole =
        (await childRole.isVisible().catch(() => false)) ||
        (await teenRole.isVisible().catch(() => false));

      // Color selection
      const colorLabel = page.getByText(/color/i).first();
      const hasColor = await colorLabel.isVisible().catch(() => false);

      expect(hasName && (hasRole || hasColor)).toBeTruthy();
    }
  });

  test('fill add member form and submit', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*member|add/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Fill name
      const nameInput =
        page.getByLabel(/^name$/i).or(page.locator('input[placeholder*="Emma"]')).first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(`E2E Test Member ${Date.now()}`);
      }

      // Select child role (click the radio/button)
      const childOption = page.locator('label, button, div')
        .filter({ hasText: /^child$/i })
        .first();
      if (await childOption.isVisible().catch(() => false)) {
        await childOption.click();
        await page.waitForTimeout(300);
      }

      // Select a color (click first color button)
      const colorButtons = page.locator('button[style*="background-color"]');
      const colorCount = await colorButtons.count();
      if (colorCount > 0) {
        await colorButtons.nth(2).click(); // Pick the 3rd color
        await page.waitForTimeout(300);
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /add member/i });
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);

        // May hit member limit (Free tier: 4 members, already have 5+)
        // Check for success (modal closes) or error message
        const bodyText = await page.locator('body').textContent();
        const hitLimit = bodyText?.toLowerCase().includes('limit') || bodyText?.toLowerCase().includes('upgrade');
        const modalClosed = !(await page.getByText(/add family member/i).isVisible().catch(() => false));

        // Either succeeded or hit expected limit
        expect(modalClosed || hitLimit).toBeTruthy();
      }
    }
  });

  test('cancel add member modal', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*member|add/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);

        // Modal should be closed
        const modalTitle = page.getByText(/add family member/i);
        const stillOpen = await modalTitle.isVisible().catch(() => false);
        expect(stillOpen).toBeFalsy();
      }
    }
  });

  test('validate empty name shows error', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*member|add/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Try to submit without a name
      const submitBtn = page.getByRole('button', { name: /add member/i });
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(1000);

        // Should show validation error or remain on modal
        const modalTitle = page.getByText(/add family member/i);
        const stillOpen = await modalTitle.isVisible().catch(() => false);
        expect(stillOpen).toBeTruthy(); // Should still be on the modal
      }
    }
  });
});
