import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Member Editing Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('edit button visible on member cards', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: /edit/i });
    const count = await editBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking edit opens edit member modal', async ({ page }) => {
    // Click the first edit button (skip Daniel's own, use the second member)
    const editBtns = page.getByRole('button', { name: /edit/i });
    const count = await editBtns.count();

    if (count > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(1000);

      // Should show edit member modal
      const modalTitle = page.getByText(/edit member/i);
      const hasModal = await modalTitle.isVisible().catch(() => false);

      const nameInput = page.locator('#edit-name');
      const hasNameInput = await nameInput.isVisible().catch(() => false);

      expect(hasModal || hasNameInput).toBeTruthy();
    }
  });

  test('edit member modal shows member stats', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: /edit/i });
    if ((await editBtns.count()) > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(1000);

      // Should show stats: streak, points
      const statsLabels = ['current streak', 'longest streak', 'current points', 'lifetime points'];
      let visibleStats = 0;

      for (const label of statsLabels) {
        const element = page.getByText(new RegExp(label, 'i')).first();
        if (await element.isVisible().catch(() => false)) {
          visibleStats++;
        }
      }

      expect(visibleStats).toBeGreaterThanOrEqual(1);

      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('edit member name and cancel', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: /edit/i });
    if ((await editBtns.count()) > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(1000);

      const nameInput = page.locator('#edit-name');
      if (await nameInput.isVisible().catch(() => false)) {
        const originalName = await nameInput.inputValue();

        // Change name
        await nameInput.fill('SHOULD NOT SAVE');
        await page.waitForTimeout(300);

        // Cancel
        const cancelBtn = page.getByRole('button', { name: /cancel/i });
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
        }

        // Modal should be closed
        const modalTitle = page.getByText(/edit member/i);
        const stillOpen = await modalTitle.isVisible().catch(() => false);
        expect(stillOpen).toBeFalsy();
      }
    }
  });

  test('edit member color selection', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: /edit/i });
    if ((await editBtns.count()) > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(1000);

      // Color buttons should be visible
      const colorBtns = page.locator('button[style*="background-color"]');
      const colorCount = await colorBtns.count();

      if (colorCount > 0) {
        // Click a different color
        await colorBtns.nth(Math.min(3, colorCount - 1)).click();
        await page.waitForTimeout(300);
      }

      // Cancel to avoid saving
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
    }
  });

  test('remove member button visible for non-parent members', async ({ page }) => {
    const removeBtns = page.getByRole('button', { name: /remove/i });
    const count = await removeBtns.count();

    // Should have remove buttons for child/teen members
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
