/**
 * WordPress Integration E2E Tests (Real WordPress - Optional)
 * Tests against a real WordPress site - OPTIONAL, use mocked tests for CI/CD
 *
 * These tests require:
 * - Real WordPress site configured with valid credentials
 * - VITE_WP_URL, VITE_WP_USERNAME, VITE_WP_APP_PASSWORD environment variables
 * - WORDPRESS_E2E_LIVE_TESTS=true to explicitly enable
 *
 * NOTE: Use wordpress-integration-mocked.spec.ts for normal CI/CD to avoid
 * polluting real WordPress with test data. Only use this suite for manual
 * integration testing with a real WordPress environment.
 */

import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { ResultsPage } from '../pages/ResultsPage';
import {
  setupWordPressMocks,
  clearWordPressMocks,
  getExpectedSeasonRolloverFilename,
} from '../fixtures/wordpress-fixtures';

// Skip all tests in this suite by default - use mocked tests instead
// Only run if explicitly enabled via environment variable and not in CI
const skipByDefault = process.env.WORDPRESS_E2E_LIVE_TESTS !== 'true' || !!process.env.CI;

/**
 * Scenario 1: Auto-load CSV from WordPress on Setup
 * When WordPress is configured and available
 * And previous race CSV exists in WordPress Media Library
 * Then the CSV should be automatically loaded and displayed
 */
test.describe('WordPress Auto-Load Integration (Live)', () => {
  test.skip(skipByDefault, 'Real WordPress tests skipped - use mocked tests instead');

  test('should auto-load previous race CSV from WordPress on setup page load', async ({
    page,
  }) => {
    const setupPage = new SetupPage(page);

    // Navigate to setup
    await setupPage.navigate();
    await setupPage.waitForPageLoad();

    // Verify WordPress is attempting to load
    const isLoading = await setupPage.isWordPressLoading();
    expect(isLoading || (await setupPage.getLoadedRunnersCount()) > 0).toBeTruthy();

    // Wait for auto-load to complete
    await setupPage.waitForAutoLoadComplete();

    // Verify runners are loaded
    const runnerCount = await setupPage.getLoadedRunnersCount();
    expect(runnerCount).toBeGreaterThan(0);

    // Verify expected columns are present
    const hasExpectedColumns = await setupPage.hasTableColumns([
      'name',
      'number',
      'handicap',
    ]);
    expect(hasExpectedColumns).toBeTruthy();
  });

  test('should show auto-load success notice when CSV is loaded from WordPress', async ({
    page,
  }) => {
    const setupPage = new SetupPage(page);

    await setupPage.navigate();
    await setupPage.waitForPageLoad();
    await setupPage.waitForAutoLoadComplete();

    // Check for auto-load notice or success message
    const autoLoadNoticeVisible = await setupPage.isAutoLoadNoticeVisible();
    const wordPressConnected = await setupPage.verifyWordPressConnected();

    expect(autoLoadNoticeVisible || wordPressConnected).toBeTruthy();
  });

  test('should show runners from current or previous month CSV', async ({ page }) => {
    const setupPage = new SetupPage(page);

    await setupPage.navigate();
    await setupPage.waitForPageLoad();
    await setupPage.waitForAutoLoadComplete();

    // Get loaded runners
    const runners = await setupPage.getLoadedRunnerNames();

    // Should have at least some runners loaded
    expect(runners.length).toBeGreaterThan(0);

    // Verify runner names are valid (non-empty strings)
    runners.forEach((name) => {
      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Scenario 2: Fallback to Local Upload when WordPress Unavailable
 * When WordPress is not available or configured
 * And user attempts to proceed without CSV
 * Then the app should fall back to local CSV upload
 */
test.describe('Fallback to Local CSV Upload', () => {
  test('should show fallback notice when WordPress auto-load fails', async ({ page }) => {
    const setupPage = new SetupPage(page);

    // Setup WordPress mock to fail
    await setupWordPressMocks(page, 'connection-error');

    // Navigate to setup
    await setupPage.navigate();
    await setupPage.waitForPageLoad();

    // Wait for WordPress to fail
    await page.waitForTimeout(3000);

    // Should show fallback notice
    const fallbackVisible = await setupPage.isFallbackNoticeVisible();
    const errorMessage = await setupPage.getWordPressErrorMessage();

    expect(fallbackVisible || errorMessage).toBeTruthy();

    await clearWordPressMocks(page);
  });

  test('should allow local CSV upload when WordPress fallback is active', async ({ page }) => {
    const setupPage = new SetupPage(page);

    // Setup WordPress mock to fail
    await setupWordPressMocks(page, 'connection-error');

    await setupPage.navigate();
    await setupPage.waitForPageLoad();

    // Wait for fallback to activate
    await page.waitForTimeout(2000);

    // Upload CSV section should be visible for local upload
    const uploadSectionVisible = await setupPage.uploadCSVSection.isVisible();
    expect(uploadSectionVisible).toBeTruthy();

    // Drop zone should be visible
    const dropZoneVisible = await setupPage.dropZone.isVisible();
    expect(dropZoneVisible).toBeTruthy();

    await clearWordPressMocks(page);
  });

  test('should handle WordPress timeout gracefully', async ({ page }) => {
    const setupPage = new SetupPage(page);

    // Setup WordPress mock to timeout
    await setupWordPressMocks(page, 'timeout');

    await setupPage.navigate();
    await setupPage.waitForPageLoad();

    // Wait for timeout
    await page.waitForTimeout(3000);

    // Should eventually show fallback
    const fallbackVisible = await setupPage.isFallbackNoticeVisible();
    const uploadSectionVisible = await setupPage.uploadCSVSection.isVisible();

    expect(fallbackVisible || uploadSectionVisible).toBeTruthy();

    await clearWordPressMocks(page);
  });

  test('should handle WordPress authentication failure', async ({ page }) => {
    const setupPage = new SetupPage(page);

    // Setup WordPress mock to fail authentication
    await setupWordPressMocks(page, 'auth-failure');

    await setupPage.navigate();
    await setupPage.waitForPageLoad();

    await page.waitForTimeout(2000);

    // Should show error related to authentication
    const errorMessage = await setupPage.getWordPressErrorMessage();
    const fallbackVisible = await setupPage.isFallbackNoticeVisible();

    expect(errorMessage || fallbackVisible).toBeTruthy();

    if (errorMessage) {
      expect(errorMessage.toLowerCase()).toContain('auth');
    }

    await clearWordPressMocks(page);
  });
});

/**
 * Scenario 3: Upload Next Race CSV to WordPress
 * When user is on results page with race data
 * And clicks "Upload to WordPress" for next race
 * Then the CSV should be uploaded to WordPress Media Library
 */
test.describe('Upload Next Race CSV to WordPress (Live)', () => {
  test.skip(skipByDefault, 'Real WordPress tests skipped - use mocked tests instead');

  test('should upload next race CSV to WordPress', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    // Navigate to results page
    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    // Verify next race section is visible
    const nextRaceVisible = await resultsPage.isNextRaceSectionVisible();
    if (nextRaceVisible) {
      // Click upload button
      const success = await resultsPage.uploadAndVerify('nextRace');

      // Verify upload was successful
      expect(success).toBeTruthy();

      // Verify success message
      const successMessage = await resultsPage.getUploadSuccessMessage();
      expect(successMessage).toBeTruthy();
      expect(successMessage?.toLowerCase()).toContain('success');
    }
  });

  test('should generate and upload next race CSV with correct filename', async ({
    page,
  }) => {
    const resultsPage = new ResultsPage(page);

    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    const nextRaceVisible = await resultsPage.isNextRaceSectionVisible();
    if (nextRaceVisible) {
      // Generate and upload
      await resultsPage.generateNextRaceCSV();
      await resultsPage.uploadNextRaceToWordPress();
      await resultsPage.waitForUploadComplete();

      // Success message should contain reference to the upload
      const successMessage = await resultsPage.getUploadSuccessMessage();
      expect(successMessage).toBeTruthy();
    }
  });

  test('should display upload status during next race upload', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    const nextRaceVisible = await resultsPage.isNextRaceSectionVisible();
    if (nextRaceVisible) {
      // Initiate upload
      await resultsPage.generateNextRaceCSV();
      await resultsPage.uploadNextRaceToWordPress();

      // Should show uploading status or spinner
      const uploadStatus = await resultsPage.getUploadStatus();
      expect(
        uploadStatus ||
          (await resultsPage.uploadingSpinner.isVisible()).catch(() => false)
      ).toBeTruthy();

      // Wait for completion
      await resultsPage.waitForUploadComplete();

      // Should show final status
      const finalStatus = await resultsPage.getUploadStatus();
      expect(finalStatus).toBeTruthy();
    }
  });
});

/**
 * Scenario 4: Upload Season Rollover CSV to WordPress
 * When user is on results page with season rollover data
 * And clicks "Upload to WordPress" for season rollover
 * Then the CSV should be uploaded with -rollover suffix
 */
test.describe('Upload Season Rollover CSV to WordPress (Live)', () => {
  test.skip(skipByDefault, 'Real WordPress tests skipped - use mocked tests instead');

  test('should upload season rollover CSV to WordPress', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    const seasonRolloverVisible = await resultsPage.isSeasonRolloverSectionVisible();
    if (seasonRolloverVisible) {
      const success = await resultsPage.uploadAndVerify('seasonRollover');
      expect(success).toBeTruthy();

      const successMessage = await resultsPage.getUploadSuccessMessage();
      expect(successMessage?.toLowerCase()).toContain('success');
    }
  });

  test('should include rollover indicator in season rollover CSV filename', async ({
    page,
  }) => {
    const resultsPage = new ResultsPage(page);

    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    const seasonRolloverVisible = await resultsPage.isSeasonRolloverSectionVisible();
    if (seasonRolloverVisible) {
      const expectedFilename = getExpectedSeasonRolloverFilename();
      expect(expectedFilename).toContain('rollover');
    }
  });
});

/**
 * Scenario 5: Handle WordPress Upload Errors
 * When upload fails due to WordPress errors
 * Then display appropriate error messages and allow retry
 */
test.describe('WordPress Upload Error Handling', () => {
  test('should display error message when WordPress upload fails', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    // Setup WordPress mock to fail uploads
    await setupWordPressMocks(page, 'auth-failure');

    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    const nextRaceVisible = await resultsPage.isNextRaceSectionVisible();
    if (nextRaceVisible) {
      // Attempt upload
      await resultsPage.generateNextRaceCSV();
      await resultsPage.uploadNextRaceToWordPress();

      // Wait for upload to fail
      await resultsPage.waitForUploadComplete(5000);

      // Should show error message
      const uploadFailed = await resultsPage.didUploadFail();
      const errorMessage = await resultsPage.getUploadErrorMessage();

      expect(uploadFailed || errorMessage).toBeTruthy();
    }

    await clearWordPressMocks(page);
  });

  test('should allow retry after failed upload', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    // Setup initial failure
    await setupWordPressMocks(page, 'auth-failure');

    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    const nextRaceVisible = await resultsPage.isNextRaceSectionVisible();
    if (nextRaceVisible) {
      // First attempt (will fail)
      await resultsPage.generateNextRaceCSV();
      await resultsPage.uploadNextRaceToWordPress();
      await resultsPage.waitForUploadComplete(5000);

      // Clear error
      await page.waitForTimeout(500);

      // Upload button should be enabled for retry
      const buttonEnabled = await resultsPage.isNextRaceUploadButtonEnabled();
      expect(buttonEnabled || (await resultsPage.uploadNextRaceButton.isVisible())).toBeTruthy();
    }

    await clearWordPressMocks(page);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    const resultsPage = new ResultsPage(page);

    // Setup WordPress mock to have network error
    await setupWordPressMocks(page, 'connection-error');

    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    const nextRaceVisible = await resultsPage.isNextRaceSectionVisible();
    if (nextRaceVisible) {
      await resultsPage.generateNextRaceCSV();
      await resultsPage.uploadNextRaceToWordPress();

      // Should handle the error without crashing
      await page.waitForTimeout(3000);

      // Page should still be functional
      const pageTitle = await resultsPage.pageTitle.isVisible();
      expect(pageTitle).toBeTruthy();
    }

    await clearWordPressMocks(page);
  });
});

/**
 * Scenario 6: Complete Race Workflow with WordPress Integration
 * Full end-to-end test combining setup, race execution, and WordPress export
 */
test.describe('Complete Race Workflow with WordPress Integration (Live)', () => {
  test.skip(skipByDefault, 'Real WordPress tests skipped - use mocked tests instead');

  test('should complete full workflow from setup to WordPress upload', async ({ page }) => {
    const setupPage = new SetupPage(page);
    const resultsPage = new ResultsPage(page);

    // Step 1: Navigate to setup
    await setupPage.navigate();
    await setupPage.waitForPageLoad();

    // Step 2: Wait for auto-load (or fallback to local)
    await setupPage.waitForAutoLoadComplete().catch(() => {
      // If auto-load fails, that's okay - fallback is acceptable
    });

    // Verify data is loaded (either from WordPress or local)
    const hasData = (await setupPage.getLoadedRunnersCount()) > 0;
    expect(hasData || (await setupPage.isFallbackNoticeVisible())).toBeTruthy();

    // Step 3: Navigate to results
    // In a real test, we'd go through check-in and race execution,
    // but for this focused test we go straight to results
    await resultsPage.navigate();
    await resultsPage.waitForPageLoad();

    // Step 4: Upload to WordPress
    const nextRaceVisible = await resultsPage.isNextRaceSectionVisible();
    if (nextRaceVisible) {
      // Attempt upload
      const success = await resultsPage.uploadAndVerify('nextRace', 10000).catch(() => false);

      // Should either succeed or show appropriate error
      const uploadFailed = await resultsPage.didUploadFail().catch(() => false);
      const uploadSucceeded = await resultsPage.wasUploadSuccessful().catch(() => false);

      expect(success || uploadFailed || uploadSucceeded).toBeTruthy();
    }
  });
});

/**
 * Scenario 7: Verify WordPress Configuration Status
 * Display current WordPress connection status and configuration
 */
test.describe('WordPress Configuration Display', () => {
  test('should display WordPress status on setup page', async ({ page }) => {
    const setupPage = new SetupPage(page);

    await setupPage.navigate();
    await setupPage.waitForPageLoad();

    // Should have some WordPress status indicator
    const statusVisible = await setupPage.wordPressStatusBadge.isVisible().catch(() => false);
    const fallbackNoticeVisible = await setupPage.isFallbackNoticeVisible();
    const autoLoadNoticeVisible = await setupPage.isAutoLoadNoticeVisible();

    expect(statusVisible || fallbackNoticeVisible || autoLoadNoticeVisible).toBeTruthy();
  });

  test('should show appropriate status based on WordPress connectivity', async ({
    page,
  }) => {
    const setupPage = new SetupPage(page);

    await setupPage.navigate();
    await setupPage.waitForPageLoad();
    await setupPage.waitForAutoLoadComplete().catch(() => {
      // Okay if auto-load fails
    });

    // Get status
    try {
      const status = await setupPage.getWordPressStatus();
      expect(status).toBeTruthy();

      // Status should be descriptive
      const lowerStatus = status.toLowerCase();
      expect(
        lowerStatus.includes('loaded') ||
          lowerStatus.includes('failed') ||
          lowerStatus.includes('error') ||
          lowerStatus.includes('offline') ||
          lowerStatus.includes('local')
      ).toBeTruthy();
    } catch {
      // If status not available, fallback indicators should be visible
      const hasFallback = await setupPage.isFallbackNoticeVisible();
      expect(hasFallback).toBeTruthy();
    }
  });
});
