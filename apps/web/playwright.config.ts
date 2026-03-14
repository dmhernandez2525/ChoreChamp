import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI
    ? 1
    : process.env.PLAYWRIGHT_WORKERS
      ? parseInt(process.env.PLAYWRIGHT_WORKERS)
      : 4,
  timeout: process.env.PLAYWRIGHT_FAST_MODE ? 30000 : 60000,
  expect: {
    timeout: process.env.PLAYWRIGHT_FAST_MODE ? 5000 : 10000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: process.env.PLAYWRIGHT_FAST_MODE
    ? [
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
            launchOptions: {
              args: [
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-background-timer-throttling',
                '--no-sandbox',
                '--disable-setuid-sandbox',
              ],
            },
          },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: '.',
  },
  outputDir: 'test-results/',
});
