import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Template Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/templates`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('templates page shows template categories', async ({ page }) => {
    // Template browser should organize templates into categories (e.g., Kitchen, Bathroom, Outdoor)
    const categoryKeywords = [
      'kitchen', 'bathroom', 'bedroom', 'outdoor', 'general',
      'cleaning', 'laundry', 'yard', 'pet', 'daily', 'weekly',
    ];

    let foundCategories = 0;
    for (const keyword of categoryKeywords) {
      const locator = page.getByText(new RegExp(keyword, 'i')).first();
      const visible = await locator.isVisible().catch(() => false);
      if (visible) foundCategories++;
    }

    // Should find at least 2 category-like labels
    expect(foundCategories).toBeGreaterThanOrEqual(2);
  });

  test('template cards display name and description', async ({ page }) => {
    // Templates should show as cards with a name/title and some description text
    const cards = page.locator(
      '[data-testid*="template"], [class*="template"], [class*="card"]'
    );
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // Verify at least one card has meaningful text content (not just an empty shell)
      const firstCard = cards.first();
      const cardText = await firstCard.textContent();
      expect(cardText).toBeTruthy();
      expect(cardText!.length).toBeGreaterThan(5);
    } else {
      // Templates might be rendered as list items or buttons instead
      const templateItems = page.getByRole('button').filter({
        hasText: /clean|wash|sweep|mop|vacuum|dishes|laundry|trash|organize|dust/i,
      });
      const itemCount = await templateItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('can filter or search templates by category', async ({ page }) => {
    // Look for filter controls: category buttons, tabs, dropdown, or search input
    const searchInput = page.getByPlaceholder(/search/i).first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    const filterButtons = page.getByRole('button').filter({
      hasText: /kitchen|bathroom|bedroom|outdoor|all|cleaning/i,
    });
    const filterButtonCount = await filterButtons.count();

    const categoryTabs = page.getByRole('tab');
    const tabCount = await categoryTabs.count();

    const selectDropdown = page.locator('select').first();
    const hasSelect = await selectDropdown.isVisible().catch(() => false);

    expect(hasSearch || filterButtonCount > 0 || tabCount > 0 || hasSelect).toBeTruthy();

    // If filter buttons exist, click one and verify the page responds
    if (filterButtonCount > 0) {
      const firstFilter = filterButtons.first();
      await firstFilter.click();
      await page.waitForTimeout(1000);
      // Page should still show template content after filtering
      await expect(page.locator('#root')).toBeVisible();
    } else if (hasSearch) {
      // Type in search and verify it accepts input
      await searchInput.fill('clean');
      const value = await searchInput.inputValue();
      expect(value).toBe('clean');
    }
  });
});
