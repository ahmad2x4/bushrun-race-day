# E2E Testing Guide - WordPress Integration

This guide covers setting up and running Playwright E2E tests for the WordPress integration in the Bushrun Race Day application.

## Overview

The E2E test suite includes comprehensive tests for:

- **Auto-load functionality**: Automatically loading previous race CSV from WordPress
- **Fallback behavior**: Gracefully falling back to local CSV upload when WordPress is unavailable
- **CSV upload**: Uploading next race and season rollover CSVs to WordPress Media Library
- **Error handling**: Proper error messages and recovery for various failure scenarios
- **Complete workflows**: Full end-to-end testing of race setup and WordPress export

## Prerequisites

### Local Testing

1. **Node.js**: 20.x or higher
2. **Development Server**: Running on `http://localhost:5174/bushrun-race-day/`
3. **WordPress Configuration**: WordPress site with Application Password authentication configured
4. **Environment Variables**: Set in `.env.local` or `.env`

### CI/CD Testing (GitHub Actions)

1. Repository secrets must be configured:
   - `WORDPRESS_URL`: WordPress site URL (e.g., https://example.com)
   - `WORDPRESS_USERNAME`: WordPress username
   - `WORDPRESS_APP_PASSWORD`: Application Password from WordPress

## Local Test Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create or update `.env.local`:

```bash
VITE_WP_URL=https://your-wordpress-site.com
VITE_WP_USERNAME=your-username
VITE_WP_APP_PASSWORD=your-app-password
```

### 3. Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:5174/bushrun-race-day/`

### 4. Run E2E Tests

#### Run All E2E Tests

```bash
npm run test:e2e
```

#### Run Specific Test Suite

```bash
# WordPress auto-load tests
npx playwright test wordpress-integration.spec.ts --grep "Auto-Load"

# Fallback tests
npx playwright test wordpress-integration.spec.ts --grep "Fallback"

# Upload tests
npx playwright test wordpress-integration.spec.ts --grep "Upload"

# Error handling tests
npx playwright test wordpress-integration.spec.ts --grep "Error"
```

#### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

This opens an interactive test runner where you can:
- See test execution in real-time
- Pause and step through tests
- Inspect page state at each step
- Debug failures visually

#### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

Opens the Playwright Inspector with:
- Step-by-step execution control
- Browser dev tools access
- Network inspection
- DOM inspection

### 5. View Test Results

#### HTML Report

```bash
npm run test:e2e
npx playwright show-report
```

Opens interactive HTML report with:
- Test results summary
- Screenshots on failure
- Video recordings
- Trace files for debugging

#### JSON Report

Test results are saved to: `test-results/test-results.json`

```bash
cat test-results/test-results.json
```

## Test Structure

### Test Files Organization

```
tests/
├── fixtures/
│   └── wordpress-fixtures.ts          # Mock data and utilities
├── pages/
│   ├── SetupPage.ts                   # Setup view page object model
│   └── ResultsPage.ts                 # Results view page object model
└── specs/
    └── wordpress-integration.spec.ts   # Main E2E test scenarios
```

### Test Scenarios

#### 1. Auto-Load Integration (4 tests)

```typescript
// Loads CSV automatically from WordPress on setup page
// Shows success notice when auto-load succeeds
// Displays runners from current/previous month
// Handles timeout gracefully
```

**Configuration Required**: WordPress URL and credentials

#### 2. Fallback Behavior (4 tests)

```typescript
// Shows fallback notice when WordPress unavailable
// Allows local CSV upload as fallback
// Handles timeout gracefully
// Handles authentication failures
```

**Runs regardless of WordPress configuration**

#### 3. Next Race Upload (3 tests)

```typescript
// Uploads next race CSV to WordPress
// Uses correct filename format (bushrun-next-race-YYYY-MM.csv)
// Displays upload status during operation
```

**Configuration Required**: WordPress URL and credentials

#### 4. Season Rollover Upload (2 tests)

```typescript
// Uploads season rollover CSV to WordPress
// Includes -rollover suffix in filename
```

**Configuration Required**: WordPress URL and credentials

#### 5. Error Handling (3 tests)

```typescript
// Displays error when upload fails
// Allows retry after failure
// Handles network errors gracefully
```

**Tests failure scenarios without real failures**

#### 6. Complete Workflow (1 test)

```typescript
// Full end-to-end: setup → auto-load → results → upload
```

**Optional tests**: Skipped if WordPress not configured

#### 7. Configuration Display (2 tests)

```typescript
// Shows WordPress connection status
// Status reflects actual connectivity
```

**Runs regardless of WordPress configuration**

## Playwright Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Base URL**: `http://localhost:5174/bushrun-race-day/`
- **Sequential Execution**: Tests run one at a time to avoid race conditions with WordPress Media Library
- **Reporters**: HTML, JSON, and JUnit XML
- **Trace Capture**: On first retry for debugging
- **Screenshots**: Only on failure
- **Video Recording**: On failure for visual debugging

### Running Specific Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"

# Mobile Safari
npx playwright test --project="Mobile Safari"
```

## Skipped Tests

Tests that require WordPress configuration are automatically skipped if:
- `VITE_WP_URL` is not set
- `VITE_WP_USERNAME` is not set
- `VITE_WP_APP_PASSWORD` is not set
- Running in CI environment without secrets

To force run skipped tests:

```bash
npx playwright test --run-with-skip-mark
```

## CI/CD Setup

### GitHub Actions Workflow

The workflow (`.github/workflows/e2e-tests.yml`) includes:

1. **E2E Tests**: Run Playwright tests with WordPress credentials
2. **Unit Tests**: Run Vitest unit tests
3. **Linting**: Check code quality
4. **Build**: Verify production build succeeds
5. **Results**: Publish test results to GitHub

### Configure Repository Secrets

Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add `WORDPRESS_URL` secret
3. Add `WORDPRESS_USERNAME` secret
4. Add `WORDPRESS_APP_PASSWORD` secret

### Workflow Triggers

The workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily schedule at 2 AM UTC

### Artifacts

Workflow produces these artifacts:
- `playwright-report-chromium`: HTML test report
- `test-videos-chromium`: Video recordings on failure (7-day retention)
- `dist`: Built application (5-day retention)

## Debugging Tests

### Using Trace Viewer

When a test fails and captures a trace:

```bash
npx playwright show-trace test-results/trace.zip
```

Trace includes:
- All network requests
- DOM snapshots at each step
- Console logs
- Screenshots

### Enable More Verbose Logging

```bash
DEBUG=pw:api npm run test:e2e
```

### Inspect Network Requests

```bash
npm run test:e2e -- --headed
```

The `--headed` flag keeps the browser visible during test execution.

## Common Issues and Solutions

### Issue: Tests timeout waiting for WordPress

**Solution**: Increase timeout in test or skip WordPress tests
```bash
# Increase timeout for specific test
npx playwright test --timeout=30000
```

### Issue: Page navigation fails

**Solution**: Verify development server is running
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

### Issue: File upload not working in tests

**Solution**: Use `setInputFiles` method in SetupPage.ts
```typescript
await setupPage.fileInput.setInputFiles(filePath);
```

### Issue: WordPress credentials not available in CI

**Solution**: Ensure GitHub repository secrets are configured
```bash
# Verify secrets are set
# Settings → Secrets and variables → Actions
```

## Best Practices

1. **Keep tests isolated**: Each test should be independent
2. **Use Page Objects**: Leverage SetupPage and ResultsPage POMs
3. **Handle async operations**: Use `waitFor` methods appropriately
4. **Clean up mocks**: Always call `clearWordPressMocks(page)` after mocking
5. **Test user workflows**: Focus on real user scenarios, not implementation details
6. **Fail fast**: Use reasonable timeouts to identify issues quickly
7. **Capture failures**: Use screenshots and videos for debugging

## Performance Considerations

- Tests run **sequentially** (not in parallel) to avoid race conditions with WordPress Media Library
- Each test takes approximately 5-15 seconds
- Full suite takes approximately 3-5 minutes
- CI/CD runs include retry logic (up to 2 retries) for flaky tests

## Extending Tests

### Add New Test Scenario

1. Add test to `wordpress-integration.spec.ts`:

```typescript
test('should do something new', async ({ page }) => {
  const setupPage = new SetupPage(page);

  await setupPage.navigate();
  // Test steps here

  expect(result).toBe(expected);
});
```

2. Update Page Objects if needed:

```typescript
// In SetupPage.ts
async newAction() {
  await this.someLocator.click();
}
```

3. Add mock data to fixtures if needed:

```typescript
// In wordpress-fixtures.ts
export const newMockData = { /* ... */ };
```

### Add Page Object Methods

Page Objects provide reusable methods for test actions:

```typescript
// Add method to SetupPage
async getSpecificData(): Promise<string> {
  const element = this.page.locator('[data-testid="specific"]');
  return await element.innerText();
}

// Use in test
const data = await setupPage.getSpecificData();
expect(data).toContain('expected');
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

## Support

For issues or questions about E2E testing:
1. Check this guide first
2. Review test output and HTML report
3. Check Playwright documentation
4. Review test trace files for debugging

---

*Last updated: 2026-01-10*
*Part of WordPress Integration Phase 5 - Testing*
