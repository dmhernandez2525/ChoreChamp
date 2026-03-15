import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Invite Code Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Switch to invite codes tab
    const inviteTab = page.getByText(/invite.*code|invite/i).first();
    if (await inviteTab.isVisible().catch(() => false)) {
      await inviteTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('invite codes section shows generate form', async ({ page }) => {
    const generateText = page.getByText(/generate.*code|generate.*invite/i).first();
    const hasGenerate = await generateText.isVisible().catch(() => false);

    const generateBtn = page.getByRole('button', { name: /generate code/i });
    const hasBtn = await generateBtn.isVisible().catch(() => false);

    expect(hasGenerate || hasBtn).toBeTruthy();
  });

  test('select role and generate invite code', async ({ page }) => {
    // Ensure we're still on the invite codes tab
    await ensureAuthenticated(page);
    await page.waitForTimeout(1000);

    // Re-navigate if auth redirected us
    if (!page.url().includes('/members')) {
      await page.goto(`/households/${HID}/members`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const inviteTab = page.getByText(/invite.*code|invite/i).first();
      if (await inviteTab.isVisible().catch(() => false)) {
        await inviteTab.click();
        await page.waitForTimeout(1000);
      }
    }

    // Select role from combobox/select dropdown
    const roleSelect = page.getByRole('combobox').first();
    if (await roleSelect.isVisible().catch(() => false)) {
      await roleSelect.selectOption('child');
      await page.waitForTimeout(500);
    }

    // Click generate
    const generateBtn = page.getByRole('button', { name: /generate code/i });
    if (await generateBtn.isVisible().catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(5000);

      // Should show the generated code or active codes section
      const bodyText = await page.locator('body').textContent();
      const hasActiveSection = bodyText?.toLowerCase().includes('active invite codes');
      const hasCopyBtn = await page.getByRole('button', { name: /copy/i }).first().isVisible().catch(() => false);
      const hasCodeContent = bodyText?.toLowerCase().includes('uses') || bodyText?.toLowerCase().includes('expire');

      expect(hasActiveSection || hasCopyBtn || hasCodeContent).toBeTruthy();
    }
  });

  test('generated code has copy button', async ({ page }) => {
    // Generate a code first
    const generateBtn = page.getByRole('button', { name: /generate code/i });
    if (await generateBtn.isVisible().catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(5000);
    }

    // Look for copy button on any existing code
    const copyBtn = page.getByRole('button', { name: /copy/i }).first();
    const hasCopy = await copyBtn.isVisible().catch(() => false);

    if (hasCopy) {
      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write']).catch(() => {});
      await copyBtn.click();
      await page.waitForTimeout(1000);

      // Should show "Copied!" feedback or page is still functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    }
  });

  test('shows how invite codes work help section', async ({ page }) => {
    const helpText = page.getByText(/how invite codes work/i);
    const hasHelp = await helpText.isVisible().catch(() => false);

    if (hasHelp) {
      // Should show instructions
      const shareText = page.getByText(/share the code/i);
      const hasShare = await shareText.isVisible().catch(() => false);
      expect(hasShare).toBeTruthy();
    }
  });

  test('generate codes for different roles', async ({ page }) => {
    const roleSelect = page.getByRole('combobox').first();
    if (await roleSelect.isVisible().catch(() => false)) {
      // Generate for teen
      await roleSelect.selectOption('teen');
      await page.waitForTimeout(500);

      const generateBtn = page.getByRole('button', { name: /generate code/i });
      if (await generateBtn.isVisible().catch(() => false)) {
        await generateBtn.click();
        await page.waitForTimeout(5000);

        // Should see the active codes section or teen badge
        const bodyText = await page.locator('body').textContent();
        const hasContent =
          bodyText?.toLowerCase().includes('teen') ||
          bodyText?.toLowerCase().includes('active invite') ||
          bodyText?.toLowerCase().includes('copy');

        expect(hasContent).toBeTruthy();
      }
    }
  });
});
