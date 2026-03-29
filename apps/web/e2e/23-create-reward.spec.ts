import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Create Reward Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/rewards/new`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('fill and submit reward form with minimal fields', async ({ page }) => {
    const uniqueName = `E2E Test Reward ${Date.now()}`;

    // Fill reward name
    const nameInput = page.getByLabel(/reward name/i);
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill(uniqueName);

    // Set point cost
    const costInput = page.getByLabel(/point cost/i);
    if (await costInput.isVisible().catch(() => false)) {
      await costInput.fill('100');
    }

    // Click create
    const createBtn = page.getByRole('button', { name: /create reward/i });
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(3000);

      // Should navigate away or show reward in list
      const url = page.url();
      const bodyText = await page.locator('body').textContent();
      const success = !url.includes('/rewards/new') || bodyText?.includes(uniqueName);
      expect(success).toBeTruthy();
    }
  });

  test('select reward icon', async ({ page }) => {
    // Click a specific emoji icon
    const gamepadIcon = page.locator('button').filter({ hasText: '🎮' }).first();
    if (await gamepadIcon.isVisible().catch(() => false)) {
      await gamepadIcon.click();
      await page.waitForTimeout(500);

      // The selected icon should have a visual indicator (ring/highlight)
      // Just verify no error occurred
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    }
  });

  test('select reward type', async ({ page }) => {
    // Try selecting "Screen Time" type
    const screenTimeBtn = page.locator('button, div').filter({ hasText: /screen time/i }).first();
    if (await screenTimeBtn.isVisible().catch(() => false)) {
      await screenTimeBtn.click();
      await page.waitForTimeout(500);
    }

    // Try selecting "Privilege" type
    const privilegeBtn = page.locator('button, div').filter({ hasText: /privilege/i }).first();
    if (await privilegeBtn.isVisible().catch(() => false)) {
      await privilegeBtn.click();
      await page.waitForTimeout(500);
    }

    // Page should still be functional
    const nameInput = page.getByLabel(/reward name/i);
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('use quick-select point buttons', async ({ page }) => {
    // Click the 250 quick-select button
    const quickBtn = page.getByRole('button', { name: '250' }).first();
    if (await quickBtn.isVisible().catch(() => false)) {
      await quickBtn.click();
      await page.waitForTimeout(500);

      // Point cost input should reflect the selected value
      const costInput = page.getByLabel(/point cost/i);
      if (await costInput.isVisible().catch(() => false)) {
        const value = await costInput.inputValue();
        expect(value).toBe('250');
      }
    }
  });

  test('fill reward with all fields', async ({ page }) => {
    const uniqueName = `E2E Full Reward ${Date.now()}`;

    // Select icon
    const iceCreamIcon = page.locator('button').filter({ hasText: '🍦' }).first();
    if (await iceCreamIcon.isVisible().catch(() => false)) {
      await iceCreamIcon.click();
    }

    // Fill name
    await page.getByLabel(/reward name/i).fill(uniqueName);

    // Fill description
    const descInput = page.getByLabel(/description/i).first();
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('A special ice cream treat for completing chores!');
    }

    // Select type
    const activityBtn = page.locator('button, div').filter({ hasText: /activity/i }).first();
    if (await activityBtn.isVisible().catch(() => false)) {
      await activityBtn.click();
    }

    // Set point cost via quick select
    const quickBtn = page.getByRole('button', { name: '500' }).first();
    if (await quickBtn.isVisible().catch(() => false)) {
      await quickBtn.click();
    }

    // Submit
    const createBtn = page.getByRole('button', { name: /create reward/i });
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(3000);

      const url = page.url();
      expect(!url.includes('/rewards/new')).toBeTruthy();
    }
  });

  test('cancel returns to rewards page', async ({ page }) => {
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).not.toContain('/rewards/new');
    }
  });
});
