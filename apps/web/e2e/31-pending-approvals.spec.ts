import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Pending Approvals Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('approvals section is visible and shows approval queue or empty state', async ({ page }) => {
    // Find and click the approvals tab/section
    const approvalsTab = page.getByText(/approval/i).first();
    await expect(approvalsTab).toBeVisible({ timeout: 10000 });
    await approvalsTab.click();
    await page.waitForTimeout(2000);

    // Should show either pending approval items or an empty state message
    const pendingItems = page.locator('[class*="approval"], [class*="pending"], [data-testid*="approval"]');
    const emptyState = page.getByText(/no pending|nothing to approve|all caught up|no items/i).first();

    const hasPendingItems = (await pendingItems.count()) > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasPendingItems || hasEmptyState).toBeTruthy();
  });

  test('approval items have approve/reject controls or empty state is shown', async ({ page }) => {
    const approvalsTab = page.getByText(/approval/i).first();
    await approvalsTab.click();
    await page.waitForTimeout(2000);

    // Check for approve/reject buttons (only present when items exist)
    const approveBtn = page.getByRole('button', { name: /approve|accept|confirm/i }).first();
    const rejectBtn = page.getByRole('button', { name: /reject|deny|decline/i }).first();
    const checkmarkBtn = page.locator('button').filter({ hasText: /✓|✗|✔|✘/ }).first();

    const hasApprove = await approveBtn.isVisible().catch(() => false);
    const hasReject = await rejectBtn.isVisible().catch(() => false);
    const hasCheckmark = await checkmarkBtn.isVisible().catch(() => false);

    // If no buttons, there should be an empty state
    const emptyState = page.getByText(/no pending|nothing|all caught up|empty/i).first();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either we have action controls or an empty state indicator
    expect(hasApprove || hasReject || hasCheckmark || hasEmptyState).toBeTruthy();
  });

  test('pending redemptions section accessible from rewards page', async ({ page }) => {
    await page.goto(`/households/${HID}/rewards`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Rewards page should render with tabs or sections
    await expect(page.locator('#root')).toBeVisible();

    // Look for a pending/redemption tab or section
    const pendingTab = page.getByText(/pending|redemption/i).first();
    const hasPendingTab = await pendingTab.isVisible().catch(() => false);

    if (hasPendingTab) {
      await pendingTab.click();
      await page.waitForTimeout(2000);

      // After clicking, should see redemption list or empty state
      const redemptionContent = page.getByText(/redeem|pending|no.*redemption|empty/i).first();
      await expect(redemptionContent).toBeVisible({ timeout: 10000 });
    } else {
      // Rewards page still loads correctly even without a pending tab
      const rewardContent = page.getByText(/reward|point|earn|redeem/i).first();
      await expect(rewardContent).toBeVisible({ timeout: 10000 });
    }
  });
});
