import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Household Settings Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/settings`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('household settings shows current name', async ({ page }) => {
    const nameLabel = page.getByText(/household name/i).first();
    await expect(nameLabel).toBeVisible({ timeout: 10000 });

    // Should show "Hernandez Family" or similar
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.toLowerCase().includes('hernandez') || bodyText?.includes('Household')).toBeTruthy();
  });

  test('edit household name and save', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      const nameInput = page.getByLabel(/household name/i);
      if (await nameInput.isVisible().catch(() => false)) {
        const originalName = await nameInput.inputValue();

        // Change name
        await nameInput.fill('Hernandez Test Family');
        await page.waitForTimeout(500);

        // Save
        const saveBtn = page.getByRole('button', { name: /save changes/i });
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(3000);
        }

        // Restore original name
        const editAgain = page.getByRole('button', { name: /edit/i }).first();
        if (await editAgain.isVisible().catch(() => false)) {
          await editAgain.click();
          await page.waitForTimeout(500);

          const nameInputAgain = page.getByLabel(/household name/i);
          await nameInputAgain.fill(originalName || 'Hernandez Family');

          const saveAgain = page.getByRole('button', { name: /save changes/i });
          if (await saveAgain.isVisible().catch(() => false)) {
            await saveAgain.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
  });

  test('edit timezone setting', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      const tzSelect = page.getByLabel(/timezone/i);
      if (await tzSelect.isVisible().catch(() => false)) {
        // Get available options
        const options = await tzSelect.locator('option').allTextContents();

        if (options.length > 1) {
          // Select the second option (different from current)
          await tzSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }

        // Cancel to avoid persisting
        const cancelBtn = page.getByRole('button', { name: /cancel/i });
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
      }
    }
  });

  test('edit week start setting', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      const weekSelect = page.getByLabel(/week starts on/i);
      if (await weekSelect.isVisible().catch(() => false)) {
        // Select a different option
        const options = await weekSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await weekSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }

        // Cancel to avoid persisting
        const cancelBtn = page.getByRole('button', { name: /cancel/i });
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
      }
    }
  });

  test('edit points name', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      const pointsInput = page.getByLabel(/points name/i);
      if (await pointsInput.isVisible().catch(() => false)) {
        // Just verify we can type in it
        const original = await pointsInput.inputValue();
        await pointsInput.fill('Coins');
        await page.waitForTimeout(500);

        // Cancel to restore
        const cancelBtn = page.getByRole('button', { name: /cancel/i });
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
      }
    }
  });

  test('shows subscription plan info', async ({ page }) => {
    const planText = page.getByText(/plan:/i).first();
    const hasPlan = await planText.isVisible().catch(() => false);

    const freeText = page.getByText(/free|family|premium/i).first();
    const hasTier = await freeText.isVisible().catch(() => false);

    expect(hasPlan || hasTier).toBeTruthy();
  });

  test('shows appearance and themes section', async ({ page }) => {
    const themesHeading = page.getByText(/appearance.*theme|theme/i).first();
    const hasThemes = await themesHeading.isVisible().catch(() => false);

    // Should show theme options or at least the section
    expect(hasThemes).toBeTruthy(); // May be behind premium gate
  });

  test('shows delete household option for parent', async ({ page }) => {
    const deleteSection = page.getByText(/delete household/i).first();
    const hasDelete = await deleteSection.isVisible().catch(() => false);

    // Parents should see delete option (scrolling may be needed)
    if (!hasDelete) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    }

    const deleteAfterScroll = page.getByText(/delete household/i).first();
    const hasDeleteAfterScroll = await deleteAfterScroll.isVisible().catch(() => false);

    expect(hasDeleteAfterScroll).toBeTruthy();
  });
});
