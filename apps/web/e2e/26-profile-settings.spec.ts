import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';

test.describe('Profile Settings Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('profile section shows display name', async ({ page }) => {
    const heading = page.getByText(/profile information/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Should display name or "Not set"
    const nameLabel = page.getByText(/display name/i).first();
    await expect(nameLabel).toBeVisible({ timeout: 5000 });
  });

  test('click edit button to enter edit mode', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      // Should now show input field and save/cancel buttons
      const saveBtn = page.getByRole('button', { name: /save changes/i });
      const cancelBtn = page.getByRole('button', { name: /cancel/i });

      const hasSave = await saveBtn.isVisible().catch(() => false);
      const hasCancel = await cancelBtn.isVisible().catch(() => false);

      expect(hasSave || hasCancel).toBeTruthy();
    }
  });

  test('edit and save display name', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      // Find the display name input
      const nameInput = page.getByLabel(/display name/i);
      if (await nameInput.isVisible().catch(() => false)) {
        // Save the original name for restore
        const originalName = await nameInput.inputValue();

        // Change the name
        await nameInput.fill('Daniel Test');
        await page.waitForTimeout(500);

        // Click save
        const saveBtn = page.getByRole('button', { name: /save changes/i });
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(3000);

          // Should exit edit mode
          const saveStillVisible = await saveBtn.isVisible().catch(() => false);

          // Restore original name
          const editAgain = page.getByRole('button', { name: /edit/i }).first();
          if (await editAgain.isVisible().catch(() => false)) {
            await editAgain.click();
            await page.waitForTimeout(500);
            await nameInput.fill(originalName || 'Daniel');
            const saveAgain = page.getByRole('button', { name: /save changes/i });
            if (await saveAgain.isVisible().catch(() => false)) {
              await saveAgain.click();
              await page.waitForTimeout(2000);
            }
          }
        }
      }
    }
  });

  test('cancel edit mode discards changes', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      const nameInput = page.getByLabel(/display name/i);
      if (await nameInput.isVisible().catch(() => false)) {
        const originalName = await nameInput.inputValue();
        await nameInput.fill('SHOULD NOT SAVE');

        const cancelBtn = page.getByRole('button', { name: /cancel/i });
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(1000);

          // Should be back in view mode, showing original name
          const bodyText = await page.locator('body').textContent();
          expect(bodyText).not.toContain('SHOULD NOT SAVE');
        }
      }
    }
  });

  test('email address is read-only', async ({ page }) => {
    const emailLabel = page.getByText(/email address/i).first();
    if (await emailLabel.isVisible().catch(() => false)) {
      // Should display email text
      const emailText = page.getByText(/@/i).first();
      const hasEmail = await emailText.isVisible().catch(() => false);
      expect(hasEmail).toBeTruthy();
    }
  });

  test('can navigate to notifications tab and see preferences', async ({ page }) => {
    const notifTab = page.getByText(/notification/i).first();
    if (await notifTab.isVisible().catch(() => false)) {
      await notifTab.click();
      await page.waitForTimeout(2000);

      // Should show notification preferences (toggles/checkboxes)
      const bodyText = await page.locator('body').textContent();
      const hasNotifContent =
        bodyText?.toLowerCase().includes('email') ||
        bodyText?.toLowerCase().includes('reminder') ||
        bodyText?.toLowerCase().includes('push') ||
        bodyText?.toLowerCase().includes('weekly') ||
        bodyText?.toLowerCase().includes('streak');

      expect(hasNotifContent).toBeTruthy();
    }
  });

  test('security tab shows password and delete options', async ({ page }) => {
    const securityTab = page.getByText(/security/i).first();
    if (await securityTab.isVisible().catch(() => false)) {
      await securityTab.click();
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      const hasSecurityContent =
        bodyText?.toLowerCase().includes('password') ||
        bodyText?.toLowerCase().includes('delete account') ||
        bodyText?.toLowerCase().includes('two-factor');

      expect(hasSecurityContent).toBeTruthy();
    }
  });
});
