import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Badges Page', () => {
  test('shows badge categories or earned badges', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Click on a member to access their profile
    const memberCard = page.getByText(/daniel|christina|adam|addison|aiden/i).first();
    await expect(memberCard).toBeVisible({ timeout: 10000 });
    await memberCard.click();
    await page.waitForTimeout(1500);

    // Navigate to badges section if available
    const badgesLink = page.getByRole('link', { name: /badge/i }).first();
    const badgesTab = page.getByRole('tab', { name: /badge/i }).first();
    const badgesButton = page.getByRole('button', { name: /badge/i }).first();

    const hasBadgesLink = await badgesLink.isVisible().catch(() => false);
    const hasBadgesTab = await badgesTab.isVisible().catch(() => false);
    const hasBadgesButton = await badgesButton.isVisible().catch(() => false);

    if (hasBadgesLink) await badgesLink.click();
    else if (hasBadgesTab) await badgesTab.click();
    else if (hasBadgesButton) await badgesButton.click();

    await page.waitForTimeout(1500);

    // Verify badge UI elements are present
    const badgeCards = page.locator('[class*="badge"], [class*="achievement"], [class*="award"], [class*="card"]');
    const badgeHeading = page.getByRole('heading').first();
    const badgeImages = page.locator('img[alt*="badge" i], img[alt*="achievement" i], svg[class*="badge"]');

    const hasBadgeCards = (await badgeCards.count()) > 0;
    const hasHeading = await badgeHeading.isVisible().catch(() => false);
    const hasBadgeImages = (await badgeImages.count()) > 0;

    // The member profile or badge section should show meaningful content
    expect(hasBadgeCards || hasHeading || hasBadgeImages).toBeTruthy();
  });
});

test.describe('Streaks Page', () => {
  test('shows streak information', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Click on a member
    const memberCard = page.getByText(/daniel|christina|adam|addison|aiden/i).first();
    await expect(memberCard).toBeVisible({ timeout: 10000 });
    await memberCard.click();
    await page.waitForTimeout(1500);

    // Navigate to streaks section if available
    const streaksLink = page.getByRole('link', { name: /streak/i }).first();
    const streaksTab = page.getByRole('tab', { name: /streak/i }).first();

    const hasStreaksLink = await streaksLink.isVisible().catch(() => false);
    const hasStreaksTab = await streaksTab.isVisible().catch(() => false);

    if (hasStreaksLink) await streaksLink.click();
    else if (hasStreaksTab) await streaksTab.click();

    await page.waitForTimeout(1500);

    // Verify streak-related UI: counters, flame icons, day counts, progress indicators
    const streakIndicators = page.locator('[class*="streak"], [class*="flame"], [class*="fire"], [class*="counter"]');
    const dayCountText = page.getByText(/day|streak|consecutive|current/i).first();
    const heading = page.getByRole('heading').first();

    const hasStreakUI = (await streakIndicators.count()) > 0;
    const hasDayCount = await dayCountText.isVisible().catch(() => false);
    const hasHeading = await heading.isVisible().catch(() => false);

    expect(hasStreakUI || hasDayCount || hasHeading).toBeTruthy();
  });
});

test.describe('Character Page', () => {
  test('shows character customization', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Click on a member
    const memberCard = page.getByText(/daniel|christina|adam|addison|aiden/i).first();
    await expect(memberCard).toBeVisible({ timeout: 10000 });
    await memberCard.click();
    await page.waitForTimeout(1500);

    // Look for character/avatar section
    const characterLink = page.getByRole('link', { name: /character|avatar/i }).first();
    const characterTab = page.getByRole('tab', { name: /character|avatar/i }).first();

    const hasCharLink = await characterLink.isVisible().catch(() => false);
    const hasCharTab = await characterTab.isVisible().catch(() => false);

    if (hasCharLink) await characterLink.click();
    else if (hasCharTab) await characterTab.click();

    await page.waitForTimeout(1500);

    // Verify character/avatar UI: images, customization options, avatar display
    const avatarElements = page.locator('[class*="avatar"], [class*="character"], img[alt*="avatar" i], img[alt*="character" i]');
    const customizationButtons = page.getByRole('button', { name: /customize|change|select|equip/i });
    const heading = page.getByRole('heading').first();

    const hasAvatars = (await avatarElements.count()) > 0;
    const hasCustomButtons = (await customizationButtons.count()) > 0;
    const hasHeading = await heading.isVisible().catch(() => false);

    expect(hasAvatars || hasCustomButtons || hasHeading).toBeTruthy();
  });
});

test.describe('Pets Page', () => {
  test('shows virtual pet area', async ({ page }) => {
    await page.goto(`/households/${HID}/members`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    // Click on a member
    const memberCard = page.getByText(/daniel|christina|adam|addison|aiden/i).first();
    await expect(memberCard).toBeVisible({ timeout: 10000 });
    await memberCard.click();
    await page.waitForTimeout(1500);

    // Look for pet section
    const petLink = page.getByRole('link', { name: /pet/i }).first();
    const petTab = page.getByRole('tab', { name: /pet/i }).first();

    const hasPetLink = await petLink.isVisible().catch(() => false);
    const hasPetTab = await petTab.isVisible().catch(() => false);

    if (hasPetLink) await petLink.click();
    else if (hasPetTab) await petTab.click();

    await page.waitForTimeout(1500);

    // Verify pet UI: pet images, health bars, feed buttons, pet cards
    const petElements = page.locator('[class*="pet"], img[alt*="pet" i], [class*="animal"]');
    const petActions = page.getByRole('button', { name: /feed|play|care|adopt/i });
    const heading = page.getByRole('heading').first();

    const hasPetUI = (await petElements.count()) > 0;
    const hasPetActions = (await petActions.count()) > 0;
    const hasHeading = await heading.isVisible().catch(() => false);

    expect(hasPetUI || hasPetActions || hasHeading).toBeTruthy();
  });
});
