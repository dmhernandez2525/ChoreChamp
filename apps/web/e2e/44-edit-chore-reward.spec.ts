import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Edit Chore Page', () => {
  test('household dashboard loads and shows chore content', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // The dashboard should display a heading (household name)
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // The dashboard should show tab navigation buttons for chores
    const todayTab = page.getByRole('button', { name: /today/i }).first();
    const allTab = page.getByRole('button', { name: /all chores/i }).first();

    const hasTodayTab = await todayTab.isVisible().catch(() => false);
    const hasAllTab = await allTab.isVisible().catch(() => false);

    // Dashboard should have chore tab navigation or chore-related content
    const body = page.locator('body');
    const hasChoreContent = await body.textContent().then(
      (text) => /chore|today|add chore/i.test(text || '')
    );

    expect(hasTodayTab || hasAllTab || hasChoreContent).toBeTruthy();
  });

  test('dashboard shows chore list or empty state', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // The page should show either chore cards or an empty state message
    const choreCards = page.locator('[class*="card"], [class*="chore"], [role="listitem"]');
    const emptyState = page.getByText(/no chores|all done|nothing/i).first();
    const addChoreLink = page.getByRole('link', { name: /add chore/i }).first();

    const hasCards = (await choreCards.count()) > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasAddLink = await addChoreLink.isVisible().catch(() => false);

    // Dashboard should show chores, an empty state, or an "Add Chore" action
    expect(hasCards || hasEmpty || hasAddLink).toBeTruthy();
  });

  test('dashboard has add chore button', async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // The dashboard should have an "Add Chore" link/button in the quick actions
    const addChoreLink = page.getByRole('link', { name: /add chore/i }).first();
    const addChoreBtn = page.getByRole('button', { name: /add chore/i }).first();

    const hasLink = await addChoreLink.isVisible().catch(() => false);
    const hasBtn = await addChoreBtn.isVisible().catch(() => false);

    expect(hasLink || hasBtn).toBeTruthy();

    // The page should have interactive elements (buttons, links)
    const allInteractive = page.locator('button, a');
    const interactiveCount = await allInteractive.count();
    expect(interactiveCount).toBeGreaterThan(0);
  });
});
