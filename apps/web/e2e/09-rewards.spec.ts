import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Rewards Store', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('rewards page loads with heading', async ({ page }) => {
    const heading = page.getByText(/reward/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows points balance', async ({ page }) => {
    // Should display some form of balance or points
    const balance = page.getByText(/balance|point/i).first();
    await expect(balance).toBeVisible({ timeout: 10000 });
  });

  test('parent sees create reward button', async ({ page }) => {
    const createBtn = page.getByText(/create.*reward/i).first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('has rewards store tab', async ({ page }) => {
    const storeTab = page.getByText(/reward.*store|store/i).first();
    await expect(storeTab).toBeVisible({ timeout: 10000 });
  });

  test('parent sees pending redemptions tab', async ({ page }) => {
    const pendingTab = page.getByText(/pending|redemption/i).first();
    await expect(pendingTab).toBeVisible({ timeout: 10000 });
  });

  test('create reward page renders form', async ({ page }) => {
    await page.goto(`/households/${HID}/rewards/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const heading = page.getByText(/create.*reward/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('create reward form has name field', async ({ page }) => {
    await page.goto(`/households/${HID}/rewards/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const nameInput = page.getByLabel(/name|title/i).first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
  });

  test('create reward form has point cost field', async ({ page }) => {
    await page.goto(`/households/${HID}/rewards/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const costField = page.getByLabel(/cost|point/i).first();
    await expect(costField).toBeVisible({ timeout: 10000 });
  });
});
