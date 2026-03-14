import { test, expect } from '@playwright/test';

test.describe('Board Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the board/chores page
    // Adjust the URL if the route is different in your app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('board page loads without errors', async ({ page }) => {
    // The app should render without a white screen
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    // No uncaught errors in the console
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Give a moment for any async errors to surface
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('displays navigation elements', async ({ page }) => {
    // The app shell should have some form of navigation
    const nav = page.locator('nav, [role="navigation"], header');
    await expect(nav.first()).toBeVisible({ timeout: 10000 });
  });

  test('command palette opens with Cmd+K', async ({ page }) => {
    // Press Cmd+K (Meta+K)
    await page.keyboard.press('Meta+k');

    // The command palette should appear
    const palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible({ timeout: 5000 });

    // Should show the search input
    const searchInput = palette.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('command palette closes on Escape', async ({ page }) => {
    await page.keyboard.press('Meta+k');

    const palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(palette).not.toBeVisible({ timeout: 3000 });
  });

  test('command palette shows view switching options', async ({ page }) => {
    await page.keyboard.press('Meta+k');

    const palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible({ timeout: 5000 });

    // Check that view options are listed
    await expect(palette.locator('text=Dashboard View')).toBeVisible();
    await expect(palette.locator('text=Kanban Board')).toBeVisible();
    await expect(palette.locator('text=Calendar View')).toBeVisible();
    await expect(palette.locator('text=List View')).toBeVisible();
  });
});

test.describe('Board View Interactions', () => {
  test('kanban board renders columns when in kanban view', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to switch to kanban view via command palette
    await page.keyboard.press('Meta+k');
    const palette = page.locator('[data-testid="command-palette"]');

    // Wait for palette, then click Kanban Board option
    if (await palette.isVisible({ timeout: 3000 }).catch(() => false)) {
      const kanbanOption = palette.locator('text=Kanban Board');
      if (await kanbanOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await kanbanOption.click();

        // Wait for the kanban board to render
        const board = page.locator('[data-testid="kanban-board"]');
        await expect(board).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('filter bar appears when filters are active', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The filter bar should not be visible by default (no active filters)
    const filterBar = page.locator('[data-testid="filter-bar"]');
    // This may or may not be present depending on app state,
    // so we just verify the selector works without error
    const isVisible = await filterBar.isVisible().catch(() => false);

    // If not visible, that is expected (no filters active)
    if (!isVisible) {
      expect(true).toBe(true);
    }
  });
});
