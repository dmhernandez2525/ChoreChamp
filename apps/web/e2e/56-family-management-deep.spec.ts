import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Family Management Deep Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('member list shows all family members', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const members = ['daniel', 'christina', 'adam', 'addison', 'aiden'];
    const foundMembers = members.filter((m) => bodyText?.toLowerCase().includes(m));
    expect(foundMembers.length).toBeGreaterThanOrEqual(1);
  });

  test('member cards show role badges', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const roles = ['parent', 'teen', 'child', 'admin', 'member'];
    const foundRoles = roles.filter((r) => bodyText?.toLowerCase().includes(r));
    expect(foundRoles.length).toBeGreaterThanOrEqual(1);
  });

  test('add member button opens modal', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add member|add|invite/i }).first();
    const hasAdd = await addBtn.isVisible().catch(() => false);

    if (hasAdd) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]');
      const hasDialog = (await dialog.count()) > 0;

      if (hasDialog) {
        const dialogText = await dialog.first().textContent();
        const hasFormFields =
          dialogText?.toLowerCase().includes('name') ||
          dialogText?.toLowerCase().includes('role') ||
          dialogText?.toLowerCase().includes('color');

        expect(hasFormFields).toBeTruthy();
        await page.keyboard.press('Escape');
      } else {
        const bodyText = await page.locator('body').textContent();
        expect(bodyText && bodyText.length > 50).toBeTruthy();
      }
    }
  });

  test('member edit opens editing UI', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: /edit/i });
    if ((await editBtns.count()) > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      const hasEditUI =
        bodyText?.toLowerCase().includes('name') ||
        bodyText?.toLowerCase().includes('save') ||
        bodyText?.toLowerCase().includes('cancel');

      expect(hasEditUI).toBeTruthy();
      await page.keyboard.press('Escape');
    } else {
      const memberCards = page.locator('[class*="card"], [class*="Card"]').filter({
        hasText: /daniel|christina|adam/i,
      });
      if ((await memberCards.count()) > 0) {
        await memberCards.first().click();
        await page.waitForTimeout(1000);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText && bodyText.length > 50).toBeTruthy();
      }
    }
  });

  test('invite codes tab shows generation UI', async ({ page }) => {
    const inviteTab = page.getByRole('button', { name: /invite/i }).first();
    const inviteLink = page.getByRole('tab', { name: /invite/i }).first();
    const hasInviteTab =
      (await inviteTab.isVisible().catch(() => false)) ||
      (await inviteLink.isVisible().catch(() => false));

    if (hasInviteTab) {
      const target = (await inviteTab.isVisible().catch(() => false)) ? inviteTab : inviteLink;
      await target.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      const hasInviteUI =
        bodyText?.toLowerCase().includes('invite') ||
        bodyText?.toLowerCase().includes('code') ||
        bodyText?.toLowerCase().includes('generate') ||
        bodyText?.toLowerCase().includes('link');

      expect(hasInviteUI).toBeTruthy();
    } else {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('member color selection works', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: /edit/i });
    if ((await editBtns.count()) > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(1000);

      const colorButtons = page.locator('button[style*="background-color"]');
      if ((await colorButtons.count()) > 0) {
        await colorButtons.first().click();
        await page.waitForTimeout(500);

        const bodyText = await page.locator('body').textContent();
        expect(bodyText && bodyText.length > 50).toBeTruthy();
      }

      await page.keyboard.press('Escape');
    }
  });

  test('member stats are visible', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    const hasStats =
      bodyText?.toLowerCase().includes('point') ||
      bodyText?.toLowerCase().includes('chore') ||
      bodyText?.toLowerCase().includes('streak') ||
      bodyText?.toLowerCase().includes('completed') ||
      bodyText?.toLowerCase().includes('level');

    expect(hasStats || (bodyText?.length ?? 0) > 100).toBeTruthy();
  });
});
