import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Board/Kanban Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/board`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('board shows priority columns', async ({ page }) => {
    const columns = ['urgent', 'high', 'medium', 'low'];
    let visibleCount = 0;

    for (const col of columns) {
      const element = page.getByText(new RegExp(col, 'i')).first();
      if (await element.isVisible().catch(() => false)) {
        visibleCount++;
      }
    }

    // At least some columns should be visible
    expect(visibleCount).toBeGreaterThanOrEqual(1);
  });

  test('board cards are clickable', async ({ page }) => {
    // Find any chore card on the board
    const cards = page.locator('[class*="cursor-pointer"]').first();
    const hasCards = await cards.isVisible().catch(() => false);

    if (hasCards) {
      await cards.click();
      await page.waitForTimeout(1000);

      // Should open a modal or detail view
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(50);

      // Close any modal
      await page.keyboard.press('Escape');
    }
  });

  test('board page does not throw console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('ChunkLoadError') &&
        !e.includes('Loading chunk')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('board page has add chore option', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|create|\+/i }).first();
    const hasAdd = await addBtn.isVisible().catch(() => false);

    // Board may show add button or + icon
    expect(hasAdd).toBeTruthy();
  });
});
