import { Page, expect } from '@playwright/test';

/**
 * Modal helper functions for E2E tests.
 * Adapted from enterprise-template-system patterns.
 */
export const modalHelpers = {
  async waitForModal(page: Page, testId: string): Promise<void> {
    await page.waitForSelector(`[data-testid="${testId}"]`, {
      state: 'visible',
    });
    // Wait for animation
    await page.waitForTimeout(300);
  },

  async closeModal(page: Page, testId: string): Promise<void> {
    const modal = page.locator(`[data-testid="${testId}"]`);
    try {
      await modal.locator('[data-testid="close-button"]').click();
    } catch {
      await page.keyboard.press('Escape');
    }
    await page.waitForSelector(`[data-testid="${testId}"]`, {
      state: 'hidden',
    });
  },

  async handleDialogOverlay(page: Page): Promise<void> {
    try {
      const overlay = page.locator('[data-radix-popper-content-wrapper]');
      if (await overlay.isVisible()) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } catch {
      // No overlay present
    }
  },

  async verifyModalAccessibility(page: Page, testId: string): Promise<void> {
    const modal = page.locator(`[data-testid="${testId}"]`);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role', 'dialog');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  },
};
