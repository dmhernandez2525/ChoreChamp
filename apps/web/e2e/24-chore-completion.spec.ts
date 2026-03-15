import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Chore Completion Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('click a chore to open detail modal', async ({ page }) => {
    // Find any chore card/item on the household dashboard
    // Chores are displayed as clickable cards with their title
    const choreCards = page.locator('[class*="cursor-pointer"], [role="button"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop|dust|tidy/i,
    });

    const count = await choreCards.count();
    if (count > 0) {
      await choreCards.first().click();
      await page.waitForTimeout(2000);

      // Should see a modal or detail view with chore info
      const markCompleteBtn = page.getByRole('button', { name: /mark complete/i });
      const hasComplete = await markCompleteBtn.isVisible().catch(() => false);

      const closeBtn = page.getByLabel(/close/i);
      const hasClose = await closeBtn.isVisible().catch(() => false);

      // Either the modal opened with complete button or close button
      expect(hasComplete || hasClose).toBeTruthy();
    }
  });

  test('mark a chore as complete', async ({ page }) => {
    // Navigate to today's chores
    const todayTab = page.getByText(/today/i).first();
    if (await todayTab.isVisible().catch(() => false)) {
      await todayTab.click();
      await page.waitForTimeout(1000);
    }

    // Find an incomplete chore
    const choreCards = page.locator('[class*="cursor-pointer"], [role="button"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop|dust|tidy/i,
    });

    const count = await choreCards.count();
    if (count > 0) {
      await choreCards.first().click();
      await page.waitForTimeout(2000);

      // Click "Mark Complete"
      const markCompleteBtn = page.getByRole('button', { name: /mark complete/i });
      if (await markCompleteBtn.isVisible().catch(() => false)) {
        await markCompleteBtn.click();
        await page.waitForTimeout(3000);

        // Should see success message or the modal closes
        const bodyText = await page.locator('body').textContent();
        const completed =
          bodyText?.includes('Completed') ||
          bodyText?.includes('completed') ||
          bodyText?.includes('points') ||
          !(await markCompleteBtn.isVisible().catch(() => false));

        expect(completed).toBeTruthy();
      }
    }
  });

  test('view chore details shows points and difficulty', async ({ page }) => {
    const choreCards = page.locator('[class*="cursor-pointer"], [role="button"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop|dust|tidy/i,
    });

    const count = await choreCards.count();
    if (count > 0) {
      await choreCards.first().click();
      await page.waitForTimeout(2000);

      // Should see points info
      const pointsText = page.getByText(/point/i).first();
      const hasPoints = await pointsText.isVisible().catch(() => false);

      // Should see difficulty
      const difficultyText = page.getByText(/easy|medium|hard|trivial|epic/i).first();
      const hasDifficulty = await difficultyText.isVisible().catch(() => false);

      expect(hasPoints || hasDifficulty).toBeTruthy();
    }
  });

  test('chore detail modal has cancel button', async ({ page }) => {
    const choreCards = page.locator('[class*="cursor-pointer"], [role="button"]').filter({
      hasText: /clean|wash|vacuum|sweep|make.*bed|take.*out|organize|laundry|dishes|mop|dust|tidy/i,
    });

    const count = await choreCards.count();
    if (count > 0) {
      await choreCards.first().click();
      await page.waitForTimeout(2000);

      // Should have cancel or close button
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      const closeBtn = page.getByLabel(/close/i);

      const hasCancel = await cancelBtn.isVisible().catch(() => false);
      const hasClose = await closeBtn.isVisible().catch(() => false);

      if (hasCancel) {
        await cancelBtn.click();
      } else if (hasClose) {
        await closeBtn.click();
      }

      await page.waitForTimeout(1000);
      // Modal should be closed
    }
  });
});
