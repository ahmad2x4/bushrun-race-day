# E2E Testing Guide - WordPress Integration

This guide covers setting up and running Playwright E2E tests for the WordPress integration in the Bushrun Race Day application.

## Overview

The E2E test suite includes two test suites with comprehensive coverage:

### Mocked Tests (Default - Use for CI/CD)
- **File**: `tests/specs/wordpress-integration-mocked.spec.ts`
- **Coverage**: 22 tests covering all scenarios
- **Data Safety**: All WordPress API calls are mocked - ZERO pollution of real WordPress
- **Speed**: Fast execution without network dependencies
- **CI/CD Ready**: Safe to run without WordPress credentials
- **Test Scenarios**: Auto-load, upload, error handling, complete workflows, data isolation

### Live Tests (Optional - For Integration Testing)
- **File**: `tests/specs/wordpress-integration.spec.ts`
- **Coverage**: 30 tests for real WordPress integration
- **Requirements**: Real WordPress site with valid credentials
- **Requires**: `WORDPRESS_E2E_LIVE_TESTS=true` environment variable
- **Skip in CI**: Automatically skipped in CI/CD to protect real data
- **Use Case**: Manual integration testing with actual WordPress environment

### What Both Suites Test
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

#### Run Mocked Tests (Default - Recommended for CI/CD)

```bash
# Run all mocked tests
npm run test:e2e

# Run only mocked tests
npx playwright test wordpress-integration-mocked.spec.ts
```

Mocked tests run without any WordPress credentials and are safe for CI/CD.

#### Run Live Tests Against Real WordPress (Optional)

```bash
# Enable live tests and run
WORDPRESS_E2E_LIVE_TESTS=true npm run test:e2e

# Or just run the live test file
WORDPRESS_E2E_LIVE_TESTS=true npx playwright test wordpress-integration.spec.ts
```

⚠️ **Warning**: Live tests will create test data in your real WordPress Media Library!

#### Run Specific Test Scenarios

```bash
# Mocked auto-load tests
npx playwright test wordpress-integration-mocked.spec.ts --grep "Auto-Load"

# Mocked upload tests
npx playwright test wordpress-integration-mocked.spec.ts --grep "Upload"

# Mocked error handling
npx playwright test wordpress-integration-mocked.spec.ts --grep "Error Handling"

# Mocked data isolation (verifies no real requests)
npx playwright test wordpress-integration-mocked.spec.ts --grep "Data Isolation"
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
│   └── wordpress-fixtures.ts                  # Mock data and utilities
├── pages/
│   ├── SetupPage.ts                           # Setup view page object model
│   └── ResultsPage.ts                         # Results view page object model
└── specs/
    ├── wordpress-integration-mocked.spec.ts   # Mocked tests (recommended for CI/CD)
    └── wordpress-integration.spec.ts          # Live tests (optional, manual testing)
```

### Test Scenarios

#### Mocked Test Suite (`wordpress-integration-mocked.spec.ts`)

All WordPress API endpoints are fully mocked - safe for CI/CD with zero risk of data pollution.

##### 1. Auto-Load Integration (Mocked) (4 tests)
- Auto-loads CSV from mocked WordPress on page load
- Shows auto-load success messages
- Displays runners from mocked CSV data
- Correct number of runners from mock data

##### 2. Upload Next Race CSV (Mocked) (3 tests)
- Uploads CSV to mocked WordPress Media Library
- Generates correct filename (bushrun-next-race-YYYY-MM.csv)
- Displays upload status messages

##### 3. Upload Season Rollover CSV (Mocked) (2 tests)
- Uploads CSV with -rollover suffix to mocked WordPress
- Includes rollover indicator in filename

##### 4. Error Handling (Mocked Failures) (5 tests)
- Handles WordPress timeout errors gracefully
- Handles authentication failures
- Handles network connection errors
- Allows retry after failed operations
- Page remains stable during errors

##### 5. Complete Workflow (Mocked) (2 tests)
- Full end-to-end workflow with mocked WordPress
- App stability through complete workflow

##### 6. Data Isolation (Mocked) (2 tests)
- Verifies only mocked data is used
- Confirms zero requests to real WordPress
- Mocked responses have correct structure

**All mocked tests run without any WordPress credentials - perfect for CI/CD!**

#### Live Test Suite (`wordpress-integration.spec.ts`)

Optional tests against real WordPress - requires explicit opt-in and valid credentials.

##### 1. Auto-Load Integration (Live) (4 tests)
```typescript
// Loads CSV automatically from real WordPress on setup page
// Shows success notice when auto-load succeeds
// Displays runners from current/previous month
// Handles timeout gracefully
```

**Configuration Required**: WordPress URL and credentials
**Enable With**: `WORDPRESS_E2E_LIVE_TESTS=true`
**⚠️ Note**: Creates test data in real WordPress Media Library

##### 2. Fallback Behavior (Live) (4 tests)
```typescript
// Shows fallback notice when real WordPress unavailable
// Allows local CSV upload as fallback
// Handles timeout gracefully
// Handles authentication failures
```

##### 3. Next Race Upload (Live) (3 tests)
```typescript
// Uploads next race CSV to real WordPress
// Uses correct filename format (bushrun-next-race-YYYY-MM.csv)
// Displays upload status during operation
```

##### 4. Season Rollover Upload (Live) (2 tests)
```typescript
// Uploads season rollover CSV to real WordPress
// Includes -rollover suffix in filename
```

##### 5. Error Handling (Live) (3 tests)
```typescript
// Displays error when upload fails
// Allows retry after failure
// Handles network errors gracefully
```

##### 6. Complete Workflow (Live) (1 test)
```typescript
// Full end-to-end: setup → auto-load → results → upload
```

##### 7. Configuration Display (Live) (2 tests)
```typescript
// Shows WordPress connection status
// Status reflects actual connectivity
```

**All live tests are skipped by default in CI/CD to protect real data!**

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

## Test Execution Strategy

### Mocked Tests (Always Run)

Mocked tests (`wordpress-integration-mocked.spec.ts`) run by default:

```bash
npm run test:e2e
```

These tests:
- ✅ Don't require WordPress credentials
- ✅ Don't hit real WordPress endpoints
- ✅ Don't pollute your WordPress Media Library
- ✅ Run fast without network latency
- ✅ Have deterministic outcomes
- ✅ Perfect for CI/CD pipelines

### Live Tests (Skipped by Default)

Live tests (`wordpress-integration.spec.ts`) are skipped by default because:
- They require real WordPress credentials
- They create test data in WordPress Media Library
- They should only run when explicitly enabled
- They should never run in CI/CD by default

**To run live tests manually:**

```bash
# Enable live tests and run
WORDPRESS_E2E_LIVE_TESTS=true npm run test:e2e

# Or specify just the live test file
WORDPRESS_E2E_LIVE_TESTS=true npx playwright test wordpress-integration.spec.ts
```

**Live tests are automatically skipped in CI/CD** (when `CI` environment variable is set) to protect your real WordPress data.

## CI/CD Setup

### GitHub Actions Workflow

The workflow (`.github/workflows/e2e-tests.yml`) includes:

1. **E2E Tests** (Mocked): Run Playwright tests with fully mocked WordPress - no credentials needed
2. **Unit Tests**: Run Vitest unit tests
3. **Linting**: Check code quality
4. **Build**: Verify production build succeeds
5. **Results**: Publish test results to GitHub

**Note**: By default, the workflow runs mocked tests and does NOT require WordPress credentials. This is intentional to keep your real WordPress data safe!

### Configure Repository Secrets (Optional)

Only needed if you want to run live tests in CI/CD. Not recommended - use mocked tests instead!

If you do want to enable live tests in CI/CD:

1. Go to Settings → Secrets and variables → Actions
2. Add `WORDPRESS_URL` secret (your WordPress site URL)
3. Add `WORDPRESS_USERNAME` secret (WordPress username)
4. Add `WORDPRESS_APP_PASSWORD` secret (WordPress Application Password)
5. Add `WORDPRESS_E2E_LIVE_TESTS` secret with value `true`

⚠️ **Warning**: Enabling live tests in CI/CD will create test data in your real WordPress. Not recommended!

### Workflow Triggers

The workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily schedule at 2 AM UTC

### Artifacts

Workflow produces these artifacts:
- `playwright-report-chromium`: HTML test report (30-day retention)
- `test-videos-chromium`: Video recordings on failure (7-day retention)
- `dist`: Built application (5-day retention)

### CI/CD Test Summary

In CI/CD, the workflow:
1. ✅ Runs **mocked E2E tests** (22 tests) - safe and fast
2. ✅ Runs **unit tests** - verifies core logic
3. ✅ Runs **linting** - enforces code quality
4. ✅ Runs **build** - verifies production build
5. ❌ Does NOT run live WordPress tests - protected by default
6. ❌ Does NOT require WordPress credentials - mocked tests only

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
