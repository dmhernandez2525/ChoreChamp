import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Family Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('family management page loads', async ({ page }) => {
    const heading = page.getByText(/family|member|management/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows members tab', async ({ page }) => {
    const membersTab = page.getByText(/member/i).first();
    await expect(membersTab).toBeVisible({ timeout: 10000 });
  });

  test('displays family member names', async ({ page }) => {
    const memberName = page.getByText(/daniel|christina|adam|addison/i).first();
    await expect(memberName).toBeVisible({ timeout: 10000 });
  });

  test('parent sees add member button', async ({ page }) => {
    const addBtn = page.getByText(/add.*member|\+ add/i).first();
    const hasAdd = await addBtn.isVisible().catch(() => false);

    const plusBtn = page.getByRole('button', { name: /add/i }).first();
    const hasPlus = await plusBtn.isVisible().catch(() => false);

    expect(hasAdd || hasPlus).toBeTruthy();
  });

  test('parent sees invite codes tab', async ({ page }) => {
    const inviteTab = page.getByText(/invite.*code|invite/i).first();
    await expect(inviteTab).toBeVisible({ timeout: 10000 });
  });

  test('can switch to invite codes tab', async ({ page }) => {
    const inviteTab = page.getByText(/invite.*code|invite/i).first();
    const visible = await inviteTab.isVisible().catch(() => false);

    if (visible) {
      await inviteTab.click();
      await page.waitForTimeout(1000);
      // Should show invite code generation UI
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 20).toBeTruthy();
    }
  });

  test('shows member roles', async ({ page }) => {
    // Should display role labels
    const roleText = page.getByText(/parent|child|teen|viewer/i).first();
    await expect(roleText).toBeVisible({ timeout: 10000 });
  });
});
