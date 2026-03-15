import { chromium, FullConfig } from '@playwright/test';
import { TEST_CONFIG } from './config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '..', 'test-results', '.auth');

/**
 * Logs in once per account role and saves the auth state (cookies + localStorage)
 * so individual tests can reuse it without hitting the login endpoint every time.
 * This avoids better-auth's rate limiter (429 errors).
 */
async function globalSetup(config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const baseURL = config.projects[0].use.baseURL || TEST_CONFIG.baseUrl;

  const browser = await chromium.launch();

  // Only set up the parent account (most tests use it).
  // Other roles can be set up on-demand if needed.
  const roles = ['parent'] as const;

  for (const role of roles) {
    const account = TEST_CONFIG.accounts[role];
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/email/i).fill(account.email);
    await page.getByLabel(/password/i).fill(account.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard (Render free tier can be slow)
    await page.waitForURL('**/dashboard', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Save the storage state (cookies + localStorage)
    const statePath = path.join(AUTH_DIR, `${role}.json`);
    await context.storageState({ path: statePath });

    await context.close();
  }

  await browser.close();
}

export default globalSetup;
