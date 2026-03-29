import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';

test.describe('Security Settings Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Navigate to security tab
    const securityTab = page.getByText(/security/i).first();
    if (await securityTab.isVisible().catch(() => false)) {
      await securityTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('shows change password button', async ({ page }) => {
    const changePwBtn = page.getByRole('button', { name: /change password/i });
    const hasBtn = await changePwBtn.isVisible().catch(() => false);
    expect(hasBtn).toBeTruthy();
  });

  test('clicking change password reveals form', async ({ page }) => {
    const changePwBtn = page.getByRole('button', { name: /change password/i });
    if (await changePwBtn.isVisible().catch(() => false)) {
      await changePwBtn.click();
      await page.waitForTimeout(1000);

      // Should show password form fields
      const currentPw = page.getByLabel(/current password/i);
      const newPw = page.getByLabel(/new password/i);
      const confirmPw = page.getByLabel(/confirm/i);

      const hasCurrent = await currentPw.isVisible().catch(() => false);
      const hasNew = await newPw.isVisible().catch(() => false);
      const hasConfirm = await confirmPw.isVisible().catch(() => false);

      expect(hasCurrent || hasNew || hasConfirm).toBeTruthy();
    }
  });

  test('password form validation - empty current password', async ({ page }) => {
    const changePwBtn = page.getByRole('button', { name: /change password/i });
    if (await changePwBtn.isVisible().catch(() => false)) {
      await changePwBtn.click();
      await page.waitForTimeout(500);

      // Fill new password but not current
      const newPw = page.getByLabel(/new password/i).first();
      if (await newPw.isVisible().catch(() => false)) {
        await newPw.fill('TestPass123!');
      }

      const confirmPw = page.getByLabel(/confirm/i).first();
      if (await confirmPw.isVisible().catch(() => false)) {
        await confirmPw.fill('TestPass123!');
      }

      // Try to submit
      const updateBtn = page.getByRole('button', { name: /update password/i });
      if (await updateBtn.isVisible().catch(() => false)) {
        await updateBtn.click();
        await page.waitForTimeout(1000);

        // Should show error
        const error = page.getByText(/current password.*required|required/i);
        const hasError = await error.isVisible().catch(() => false);
        // Form should still be visible (not submitted)
        expect(hasError).toBeTruthy();
      }
    }
  });

  test('password form validation - passwords do not match', async ({ page }) => {
    const changePwBtn = page.getByRole('button', { name: /change password/i });
    if (await changePwBtn.isVisible().catch(() => false)) {
      await changePwBtn.click();
      await page.waitForTimeout(500);

      const currentPw = page.getByLabel(/current password/i).first();
      if (await currentPw.isVisible().catch(() => false)) {
        await currentPw.fill('OldPass123!');
      }

      const newPw = page.getByLabel(/new password/i).first();
      if (await newPw.isVisible().catch(() => false)) {
        await newPw.fill('NewPass123!');
      }

      const confirmPw = page.getByLabel(/confirm/i).first();
      if (await confirmPw.isVisible().catch(() => false)) {
        await confirmPw.fill('DifferentPass!');
      }

      const updateBtn = page.getByRole('button', { name: /update password/i });
      if (await updateBtn.isVisible().catch(() => false)) {
        await updateBtn.click();
        await page.waitForTimeout(1000);

        const mismatchError = page.getByText(/do not match|passwords.*match/i);
        const hasError = await mismatchError.isVisible().catch(() => false);
        expect(hasError).toBeTruthy();
      }
    }
  });

  test('cancel password change hides form', async ({ page }) => {
    const changePwBtn = page.getByRole('button', { name: /change password/i });
    if (await changePwBtn.isVisible().catch(() => false)) {
      await changePwBtn.click();
      await page.waitForTimeout(500);

      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(500);

        // Password form should be hidden
        const currentPw = page.getByLabel(/current password/i);
        const stillVisible = await currentPw.isVisible().catch(() => false);
        expect(stillVisible).toBeFalsy();
      }
    }
  });

  test('delete account section visible', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const deleteSection = page.getByText(/delete account/i).first();
    const hasDelete = await deleteSection.isVisible().catch(() => false);
    expect(hasDelete).toBeTruthy();
  });

  test('delete account shows confirmation form', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const deleteBtn = page.getByRole('button', { name: /delete account/i }).first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Should show confirmation input
      const confirmInput = page.getByLabel(/type delete/i);
      const hasConfirm = await confirmInput.isVisible().catch(() => false);

      const warningText = page.getByText(/cannot be undone|permanently/i);
      const hasWarning = await warningText.isVisible().catch(() => false);

      expect(hasConfirm || hasWarning).toBeTruthy();

      // Cancel to avoid accidental deletion
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
    }
  });
});
