import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Board Page Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/board`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('board page has view switching controls', async ({ page }) => {
    // Look for kanban/list/calendar view toggle buttons or tabs
    const viewButtons = page.getByRole('button').filter({
      hasText: /kanban|calendar|list|board|grid|table/i,
    });
    const viewTabs = page.getByRole('tab').filter({
      hasText: /kanban|calendar|list|board|grid|table/i,
    });

    const buttonCount = await viewButtons.count();
    const tabCount = await viewTabs.count();
    const totalViewOptions = buttonCount + tabCount;

    expect(totalViewOptions).toBeGreaterThanOrEqual(2);
  });

  test('board shows chore cards with titles', async ({ page }) => {
    // The board should display chore cards with recognizable chore names
    const body = page.locator('body');
    const choreKeywords = /clean|wash|vacuum|sweep|organize|laundry|dishes|mop|take|make|dust|trash|bed|floor|bathroom|kitchen/i;

    // Find elements that look like chore cards
    const choreCards = page.locator('[class*="card"], [class*="Card"], [data-testid*="chore"], [role="listitem"]').filter({
      hasText: choreKeywords,
    });

    const cardCount = await choreCards.count();

    if (cardCount > 0) {
      // Verify at least one card has visible text
      await expect(choreCards.first()).toBeVisible();
      const firstCardText = await choreCards.first().textContent();
      expect(firstCardText).toBeTruthy();
      expect(firstCardText!.length).toBeGreaterThan(2);
    } else {
      // Fallback: check that the body itself contains chore-related content
      await expect(body).toContainText(choreKeywords);
    }
  });

  test('board has search or filter functionality', async ({ page }) => {
    // Look for a search input or filter button
    const searchInput = page.getByPlaceholder(/search|filter|find/i).first();
    const filterBtn = page.getByRole('button', { name: /filter/i }).first();

    const hasSearch = await searchInput.isVisible().catch(() => false);
    const hasFilter = await filterBtn.isVisible().catch(() => false);

    // At least one of search or filter should exist
    expect(hasSearch || hasFilter).toBeTruthy();

    if (hasSearch) {
      await expect(searchInput).toBeVisible();
    }
    if (hasFilter) {
      await expect(filterBtn).toBeVisible();
    }
  });

  test('priority columns or categories are visible', async ({ page }) => {
    const body = page.locator('body');

    // Board should show priority levels, status columns, or category groupings
    const priorityTerms = ['high', 'medium', 'low', 'urgent', 'normal', 'todo', 'done', 'in progress', 'pending', 'daily', 'weekly'];
    const bodyText = await body.textContent();
    const lowerBody = bodyText?.toLowerCase() ?? '';

    const foundTerms = priorityTerms.filter((term) => lowerBody.includes(term));
    expect(foundTerms.length).toBeGreaterThanOrEqual(1);
  });
});
