import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 *
 * NOTE: This config requires Node.js 18.19+ or 20.19+ to load ESM modules.
 * The project uses Vite which requires Node.js 20.19+ or 22.12+.
 *
 * WordPress Integration E2E Tests Configuration
 *
 * Required environment variables:
 * - VITE_WP_URL: WordPress site URL (e.g., https://example.com)
 * - VITE_WP_USERNAME: WordPress username
 * - VITE_WP_APP_PASSWORD: WordPress Application Password
 *
 * To run tests:
 * 1. Start dev server manually: npm run dev
 * 2. Run tests: npm run test:e2e
 * 3. View results: npx playwright show-report
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests sequentially to avoid race conditions with WordPress Media Library */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run tests sequentially in CI due to shared WordPress state */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5174/bushrun-race-day/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174/bushrun-race-day/',
    reuseExistingServer: !process.env.CI,
  },
});
