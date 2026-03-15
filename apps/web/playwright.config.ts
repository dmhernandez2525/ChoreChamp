import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, 'test-results', '.auth');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests in order for video tutorial
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Sequential for consistent video recording
  timeout: process.env.PLAYWRIGHT_FAST_MODE ? 30000 : 60000,
  expect: {
    timeout: process.env.PLAYWRIGHT_FAST_MODE ? 5000 : 10000,
  },
  globalSetup: './e2e/global-setup.ts',
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on', // Record ALL tests for video validation
    actionTimeout: 15000,
    navigationTimeout: 30000,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    // Unauthenticated tests (smoke, landing, auth page)
    {
      name: 'no-auth',
      testMatch: /smoke\.spec|01-landing\.spec|02-auth\.spec/,
      use: process.env.PLAYWRIGHT_FAST_MODE
        ? {
            ...devices['Desktop Chrome'],
            launchOptions: {
              args: [
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--no-sandbox',
                '--disable-setuid-sandbox',
              ],
            },
          }
        : { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    // Authenticated tests (reuse saved auth state)
    {
      name: 'authenticated',
      testIgnore: /smoke\.spec|01-landing\.spec|02-auth\.spec/,
      use: {
        ...(process.env.PLAYWRIGHT_FAST_MODE
          ? {
              ...devices['Desktop Chrome'],
              launchOptions: {
                args: [
                  '--disable-web-security',
                  '--disable-features=TranslateUI',
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                ],
              },
            }
          : { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } }),
        storageState: path.join(AUTH_DIR, 'parent.json'),
      },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined // Skip webServer when using external URL (e.g., prod)
    : {
        command: 'pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        cwd: '.',
      },
  outputDir: 'test-results/',
});
