import { Page, expect } from '@playwright/test';

/**
 * Navigation helper functions for E2E tests.
 */
export const navigationHelpers = {
  async goToDashboard(page: Page): Promise<void> {
    await page.getByTestId('nav-dashboard').click();
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  },

  async goToChores(page: Page): Promise<void> {
    await page.getByTestId('nav-chores').click();
    await expect(page.locator('[data-testid="chores-view"]')).toBeVisible();
  },

  async goToBoard(page: Page): Promise<void> {
    await this.goToChores(page);
    await page.getByTestId('view-switcher-kanban').click();
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
  },

  async goToCalendar(page: Page): Promise<void> {
    await this.goToChores(page);
    await page.getByTestId('view-switcher-calendar').click();
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
  },

  async goToList(page: Page): Promise<void> {
    await this.goToChores(page);
    await page.getByTestId('view-switcher-list').click();
    await expect(page.locator('[data-testid="list-view"]')).toBeVisible();
  },

  async waitForPageLoad(page: Page): Promise<void> {
    // Wait for loading spinners to disappear
    const spinner = page.locator('[data-testid="loading-spinner"]');
    try {
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may never have appeared
    }
    await page.waitForLoadState('networkidle');
  },
};
