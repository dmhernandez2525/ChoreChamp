import { test, expect } from '@playwright/test';
import { openHousehold } from './helpers';
import { TEST_CONFIG } from './config';

test.describe('Household Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Auth state is restored from storageState (global-setup.ts)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await openHousehold(page);
  });

  test('renders household page content', async ({ page }) => {
    // Wait for the page to fully render with API data
    await page.waitForTimeout(3000);
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    // Should have some visible text content beyond just the shell
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
    await page.waitForTimeout(500);
  });

  test('displays chores or chore-related content', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for chore-related content or UI elements
    const hasChoreContent = await page.getByText(/chore|task|today|all/i).first().isVisible().catch(() => false);
    expect(hasChoreContent).toBeTruthy();
    await page.waitForTimeout(500);
  });

  test('shows family members', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show at least one member name
    const memberName = page.getByText(/daniel|christina|adam|addison/i).first();
    await expect(memberName).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
  });
});
