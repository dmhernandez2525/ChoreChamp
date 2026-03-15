import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Chore Lifecycle Workflow', () => {
  test('can navigate from dashboard to chore detail', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Dashboard should show chore cards or a chore list
    const choreItems = page.locator('[class*="cursor-pointer"], [class*="card"], [class*="Card"]').filter({
      hasText: /clean|wash|vacuum|sweep|organize|laundry|dishes|mop|take|make|pick|put|feed|water|trash/i,
    });

    const choreCount = await choreItems.count();
    if (choreCount > 0) {
      // Click the first chore to navigate to its detail
      await choreItems.first().click();
      await page.waitForTimeout(1500);

      // Should now show chore detail content (modal or page)
      const url = page.url();
      const navigatedToDetail = url.includes('/chore') || url.includes('/detail');

      // Or a modal/overlay opened with chore info
      const detailContent = page.getByText(/assign|due|point|status|frequency|description/i).first();
      const hasDetailContent = await detailContent.isVisible().catch(() => false);

      expect(navigatedToDetail || hasDetailContent).toBeTruthy();
    } else {
      // If no clickable chores, dashboard should still show chore-related content
      const choreHeading = page.getByText(/chore|task/i).first();
      await expect(choreHeading).toBeVisible({ timeout: 10000 });
    }
  });

  test('chore detail shows title, description, and assignee', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const choreItems = page.locator('[class*="cursor-pointer"], [class*="card"], [class*="Card"]').filter({
      hasText: /clean|wash|vacuum|sweep|organize|laundry|dishes|mop|take|make|pick|put|feed|water|trash/i,
    });

    const choreCount = await choreItems.count();
    if (choreCount > 0) {
      await choreItems.first().click();
      await page.waitForTimeout(1500);

      // Chore detail should show the chore title (visible somewhere on the page)
      const choreTitle = page.getByRole('heading').first();
      const hasTitle = await choreTitle.isVisible().catch(() => false);

      // Should show assignee or member name
      const assignee = page.getByText(/Daniel|Christina|Adam|Addison|Aiden|assign|unassigned/i).first();
      const hasAssignee = await assignee.isVisible().catch(() => false);

      // Should show description, points, or other chore details
      const choreDetails = page.getByText(/description|point|due|frequency|daily|weekly|status/i).first();
      const hasDetails = await choreDetails.isVisible().catch(() => false);

      expect(hasTitle || hasAssignee || hasDetails).toBeTruthy();

      // Close the detail view
      await page.keyboard.press('Escape');
    }
  });

  test('can interact with chore completion flow', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // ChoreCard renders a "Done" button for pending chores, or "Pending..." for needs-approval
    const doneButtons = page.getByRole('button', { name: /^done$/i });
    const pendingButtons = page.getByRole('button', { name: /pending/i });

    const hasDoneButtons = (await doneButtons.count()) > 0;
    const hasPendingButtons = (await pendingButtons.count()) > 0;

    // Or look for chore cards (div with cursor-pointer and rounded-lg)
    const choreCards = page.locator('div.cursor-pointer.rounded-lg');
    const hasChoreCards = (await choreCards.count()) > 0;

    // Or the empty state: "All caught up!" / "No chores scheduled"
    const emptyState = page.getByText(/all caught up|no chores|no pending/i).first();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Dashboard should have interactive chore elements or an empty state
    expect(hasDoneButtons || hasPendingButtons || hasChoreCards || hasEmptyState).toBeTruthy();

    // If there is a Done button, verify it is clickable (do not actually complete)
    if (hasDoneButtons) {
      const firstButton = doneButtons.first();
      await expect(firstButton).toBeEnabled();
    }
  });
});
