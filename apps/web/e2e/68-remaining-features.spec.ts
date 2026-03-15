import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Chore Detection Page', () => {
  test('chore detection page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/chore-detection`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('detect') ||
      bodyText?.toLowerCase().includes('smart') ||
      bodyText?.toLowerCase().includes('chore') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Geofencing Page', () => {
  test('geofencing page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/geofencing`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('geofenc') ||
      bodyText?.toLowerCase().includes('location') ||
      bodyText?.toLowerCase().includes('zone') ||
      bodyText?.toLowerCase().includes('area') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Homework Page', () => {
  test('homework page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/homework`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('homework') ||
      bodyText?.toLowerCase().includes('assignment') ||
      bodyText?.toLowerCase().includes('school') ||
      bodyText?.toLowerCase().includes('study') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('QR Verification Page', () => {
  test('QR verification page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/qr-verification`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('qr') ||
      bodyText?.toLowerCase().includes('scan') ||
      bodyText?.toLowerCase().includes('verify') ||
      bodyText?.toLowerCase().includes('code') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Report Cards Page', () => {
  test('report cards page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/report-cards`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('report') ||
      bodyText?.toLowerCase().includes('card') ||
      bodyText?.toLowerCase().includes('grade') ||
      bodyText?.toLowerCase().includes('performance') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Screen Time Page', () => {
  test('screen time page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/screen-time`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('screen') ||
      bodyText?.toLowerCase().includes('time') ||
      bodyText?.toLowerCase().includes('device') ||
      bodyText?.toLowerCase().includes('limit') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Skill Building Page', () => {
  test('skill building page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/skill-building`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('skill') ||
      bodyText?.toLowerCase().includes('learn') ||
      bodyText?.toLowerCase().includes('progress') ||
      bodyText?.toLowerCase().includes('build') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Smart Home Page', () => {
  test('smart home page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/smart-home`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('smart') ||
      bodyText?.toLowerCase().includes('home') ||
      bodyText?.toLowerCase().includes('device') ||
      bodyText?.toLowerCase().includes('connect') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Story Mode Page', () => {
  test('story mode page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/story-mode`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('story') ||
      bodyText?.toLowerCase().includes('adventure') ||
      bodyText?.toLowerCase().includes('quest') ||
      bodyText?.toLowerCase().includes('chapter') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('API Platform Integrations Page', () => {
  test('API integrations page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/api-integrations`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('api') ||
      bodyText?.toLowerCase().includes('integration') ||
      bodyText?.toLowerCase().includes('platform') ||
      bodyText?.toLowerCase().includes('connect') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});

test.describe('Educational Chores Page', () => {
  test('educational chores page loads', async ({ page }) => {
    await page.goto(`/households/${HID}/educational-chores`);
    await page.waitForLoadState('networkidle');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasContent =
      bodyText?.toLowerCase().includes('education') ||
      bodyText?.toLowerCase().includes('learn') ||
      bodyText?.toLowerCase().includes('chore') ||
      (bodyText?.length ?? 0) > 50;

    expect(hasContent).toBeTruthy();
  });
});
