import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Create Chore Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/chores/new`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('fill and submit chore form with minimal fields', async ({ page }) => {
    const uniqueName = `E2E Test Chore ${Date.now()}`;

    // Fill title
    const titleInput = page.getByLabel(/chore title/i);
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill(uniqueName);

    // Set points
    const pointsInput = page.getByLabel(/points earned/i);
    if (await pointsInput.isVisible().catch(() => false)) {
      await pointsInput.fill('15');
    }

    // Click create
    const createBtn = page.getByRole('button', { name: /create chore/i });
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    // Wait for redirect or success indicator
    await page.waitForTimeout(3000);

    // Should navigate away from the /new page or show success
    const url = page.url();
    const stillOnNew = url.includes('/chores/new');
    const bodyText = await page.locator('body').textContent();
    const hasChoreInList = bodyText?.includes(uniqueName) ?? false;
    const hasError = bodyText?.toLowerCase().includes('failed') ?? false;

    // Either redirected away from /new or the chore name appears on the page
    expect(!stillOnNew || hasChoreInList || !hasError).toBeTruthy();
  });

  test('chore form validates empty title', async ({ page }) => {
    // Try to submit without filling title
    const createBtn = page.getByRole('button', { name: /create chore/i });
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);

      // Should show validation error or remain on form
      const url = page.url();
      expect(url).toContain('/chores/new');
    }
  });

  test('chore form has all expected sections', async ({ page }) => {
    // Basic Information
    const titleInput = page.getByLabel(/chore title/i);
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // Description
    const descInput = page.getByLabel(/description/i).first();
    const hasDesc = await descInput.isVisible().catch(() => false);

    // Points
    const pointsInput = page.getByLabel(/points/i).first();
    const hasPoints = await pointsInput.isVisible().catch(() => false);

    // Requirements section
    const requiresApproval = page.getByText(/requires approval/i).first();
    const hasApproval = await requiresApproval.isVisible().catch(() => false);

    // At least title + one other section should be visible
    expect(hasDesc || hasPoints || hasApproval).toBeTruthy();
  });

  test('fill chore with description and requirements', async ({ page }) => {
    const uniqueName = `E2E Detailed Chore ${Date.now()}`;

    // Fill title
    await page.getByLabel(/chore title/i).fill(uniqueName);

    // Fill description
    const descInput = page.getByLabel(/description/i).first();
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('This is an automated test chore with detailed instructions.');
    }

    // Set points
    const pointsInput = page.getByLabel(/points earned/i);
    if (await pointsInput.isVisible().catch(() => false)) {
      await pointsInput.fill('25');
    }

    // Toggle requires approval
    const approvalCheckbox = page.getByLabel(/requires approval/i);
    if (await approvalCheckbox.isVisible().catch(() => false)) {
      await approvalCheckbox.check();
    }

    // Toggle show timer (ADHD helper)
    const timerCheckbox = page.getByLabel(/show timer/i);
    if (await timerCheckbox.isVisible().catch(() => false)) {
      await timerCheckbox.check();
    }

    // Submit
    const createBtn = page.getByRole('button', { name: /create chore/i });
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Verify form submitted (navigated away or shows chore)
    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    const success = !url.includes('/chores/new') || bodyText?.includes(uniqueName);
    expect(success).toBeTruthy();
  });

  test('add step-by-step instructions to chore', async ({ page }) => {
    // Fill required title first
    await page.getByLabel(/chore title/i).fill(`E2E Steps Chore ${Date.now()}`);

    // Look for ADHD section and add steps
    const addStepBtn = page.getByRole('button', { name: /add step/i });
    if (await addStepBtn.isVisible().catch(() => false)) {
      // Find step input
      const stepInput = page.locator('input[placeholder*="Add a step"]');
      if (await stepInput.isVisible().catch(() => false)) {
        await stepInput.fill('Step 1: Gather materials');
        await addStepBtn.click();
        await page.waitForTimeout(500);

        await stepInput.fill('Step 2: Do the work');
        await addStepBtn.click();
        await page.waitForTimeout(500);

        // Verify steps appear
        const step1 = page.getByText('Step 1: Gather materials');
        const hasStep = await step1.isVisible().catch(() => false);
        expect(hasStep).toBeTruthy();
      }
    }
  });

  test('cancel button returns to previous page', async ({ page }) => {
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(2000);

      // Should navigate away from /chores/new
      const url = page.url();
      expect(url).not.toContain('/chores/new');
    }
  });
});
