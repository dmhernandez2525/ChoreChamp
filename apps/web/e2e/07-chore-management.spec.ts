import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Chore Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('household dashboard shows today tab', async ({ page }) => {
    const todayTab = page.getByText(/today/i).first();
    await expect(todayTab).toBeVisible({ timeout: 10000 });
  });

  test('household dashboard shows all tab', async ({ page }) => {
    const allTab = page.getByText(/all/i).first();
    await expect(allTab).toBeVisible({ timeout: 10000 });
  });

  test('household dashboard shows approvals tab for parent', async ({ page }) => {
    const approvalsTab = page.getByText(/approval/i).first();
    await expect(approvalsTab).toBeVisible({ timeout: 10000 });
  });

  test('create chore page renders form', async ({ page }) => {
    await page.goto(`/households/${HID}/chores/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show "Create New Chore" heading or the form
    const heading = page.getByText(/create.*chore/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('create chore form has title field', async ({ page }) => {
    await page.goto(`/households/${HID}/chores/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const titleInput = page.getByLabel(/title|name/i).first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });
  });

  test('create chore form has point value field', async ({ page }) => {
    await page.goto(`/households/${HID}/chores/new`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // May be labeled "Points" or "Point Value" or be a number input
    const pointsField = page.getByLabel(/point/i).first();
    const hasPoints = await pointsField.isVisible().catch(() => false);

    const valueField = page.getByText(/point/i).first();
    const hasValue = await valueField.isVisible().catch(() => false);

    expect(hasPoints || hasValue).toBeTruthy();
  });

  test('create chore form has difficulty selector', async ({ page }) => {
    await page.goto(`/households/${HID}/chores/new`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const difficultyField = page.getByText(/difficulty/i).first();
    await expect(difficultyField).toBeVisible({ timeout: 10000 });
  });

  test('can switch between today and all tabs', async ({ page }) => {
    const allTab = page.getByText(/all/i).first();
    await allTab.click();
    await page.waitForTimeout(1000);

    // Clicking All tab should show all chores
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 20).toBeTruthy();
  });

  test('household dashboard shows create chore option', async ({ page }) => {
    // Parents should see a way to create chores
    const createBtn = page.getByText(/create.*chore|add.*chore|\+ chore/i).first();
    const hasCreate = await createBtn.isVisible().catch(() => false);

    // Or there might be a + button or link to create chores
    const plusBtn = page.getByRole('link', { name: /create|new|add/i }).first();
    const hasPlus = await plusBtn.isVisible().catch(() => false);

    expect(hasCreate || hasPlus).toBeTruthy();
  });
});
