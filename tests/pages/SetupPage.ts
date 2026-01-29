/**
 * SetupPage Page Object Model
 * Handles interactions with the Setup view for WordPress integration testing
 */

import { readFileSync } from 'fs';
import { Page, Locator } from '@playwright/test';

export class SetupPage {
  private page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly uploadCSVSection: Locator;
  readonly dropZone: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly wordPressStatusBadge: Locator;
  readonly wordPressLoadingIndicator: Locator;
  readonly wordPressErrorMessage: Locator;
  readonly wordPressSuccessMessage: Locator;
  readonly runnersList: Locator;
  readonly runnersTable: Locator;
  readonly startCheckinButton: Locator;
  readonly autoLoadNotice: Locator;
  readonly localUploadFallbackNotice: Locator;

  constructor(page: Page) {
    this.page = page;

    // Setup view locators
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /setup|runners/i });
    this.uploadCSVSection = page.locator('[data-testid="upload-csv-section"]');
    this.dropZone = page.locator('[data-testid="csv-drop-zone"]');
    this.fileInput = page.locator('input[type="file"]');
    this.uploadButton = page.locator('button:has-text("Upload")');

    // WordPress related locators
    this.wordPressStatusBadge = page.locator('[data-testid="wordpress-status"]');
    this.wordPressLoadingIndicator = page.locator('[data-testid="wordpress-loading"]');
    this.wordPressErrorMessage = page.locator('[data-testid="wordpress-error"]');
    this.wordPressSuccessMessage = page.locator('[data-testid="wordpress-success"]');

    // Runners display locators
    this.runnersList = page.locator('[data-testid="runners-list"]');
    this.runnersTable = page.locator('table');
    this.startCheckinButton = page.locator('button:has-text("Start Check-in"), button:has-text("Begin Check-in")');

    // Fallback notices
    this.autoLoadNotice = page.locator('[data-testid="auto-load-notice"]');
    this.localUploadFallbackNotice = page.locator('[data-testid="local-upload-fallback"]');
  }

  /**
   * Navigate to the setup page
   */
  async navigate(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for setup page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Check if WordPress is loading CSV data
   */
  async isWordPressLoading(): Promise<boolean> {
    try {
      await this.wordPressLoadingIndicator.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for WordPress loading to complete
   */
  async waitForWordPressLoadingComplete(timeout: number = 10000): Promise<void> {
    await this.wordPressLoadingIndicator.waitFor({
      state: 'hidden',
      timeout,
    });
  }

  /**
   * Get WordPress status message
   */
  async getWordPressStatus(): Promise<string> {
    await this.wordPressStatusBadge.waitFor({ state: 'visible', timeout: 5000 });
    return await this.wordPressStatusBadge.innerText();
  }

  /**
   * Check if WordPress auto-load was successful
   */
  async wasAutoLoadSuccessful(): Promise<boolean> {
    try {
      const status = await this.getWordPressStatus();
      return status.toLowerCase().includes('loaded') || status.toLowerCase().includes('success');
    } catch {
      return false;
    }
  }

  /**
   * Get error message from WordPress
   */
  async getWordPressErrorMessage(): Promise<string | null> {
    try {
      await this.wordPressErrorMessage.waitFor({ state: 'visible', timeout: 2000 });
      return await this.wordPressErrorMessage.innerText();
    } catch {
      return null;
    }
  }

  /**
   * Check if fallback to local upload is shown
   */
  async isFallbackNoticeVisible(): Promise<boolean> {
    try {
      await this.localUploadFallbackNotice.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the text of fallback notice
   */
  async getFallbackNoticeText(): Promise<string> {
    return await this.localUploadFallbackNotice.innerText();
  }

  /**
   * Get number of loaded runners
   */
  async getLoadedRunnersCount(): Promise<number> {
    const rows = await this.page.locator('tbody tr').count();
    return rows;
  }

  /**
   * Get runner names from loaded list
   */
  async getLoadedRunnerNames(): Promise<string[]> {
    const names = await this.page.locator('tbody tr td:first-child').allInnerTexts();
    return names;
  }

  /**
   * Upload CSV file via file input
   */
  async uploadCSVFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Upload CSV via drag and drop
   */
  async uploadCSVViaDragDrop(filePath: string): Promise<void> {
    // Create a temporary file for drag-drop
    const buffer = readFileSync(filePath);
    const dataTransfer = await this.page.evaluateHandle((data) => {
      const dt = new DataTransfer();
      const file = new File([data], 'test.csv', { type: 'text/csv' });
      dt.items.add(file);
      return dt;
    }, buffer);

    await this.dropZone.dispatchEvent('drop', { dataTransfer });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the start check-in button
   */
  async clickStartCheckin(): Promise<void> {
    await this.startCheckinButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify runners are displayed
   */
  async verifyRunnersDisplayed(): Promise<boolean> {
    try {
      const count = await this.getLoadedRunnersCount();
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get table header row
   */
  async getTableHeaders(): Promise<string[]> {
    const headers = await this.page.locator('thead th').allInnerTexts();
    return headers;
  }

  /**
   * Verify specific columns exist in the table
   */
  async hasTableColumns(columnNames: string[]): Promise<boolean> {
    const headers = await this.getTableHeaders();
    return columnNames.every((col) => headers.some((h) => h.toLowerCase().includes(col.toLowerCase())));
  }

  /**
   * Wait for specific number of runners to be loaded
   */
  async waitForRunnerCount(expectedCount: number, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const count = await this.getLoadedRunnersCount();
      if (count === expectedCount) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    throw new Error(
      `Expected ${expectedCount} runners, but got ${await this.getLoadedRunnersCount()}`
    );
  }

  /**
   * Check if auto-load notice is visible
   */
  async isAutoLoadNoticeVisible(): Promise<boolean> {
    try {
      await this.autoLoadNotice.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get auto-load notice text
   */
  async getAutoLoadNoticeText(): Promise<string> {
    return await this.autoLoadNotice.innerText();
  }

  /**
   * Verify WordPress status badge shows connected
   */
  async verifyWordPressConnected(): Promise<boolean> {
    try {
      const status = await this.getWordPressStatus();
      return (
        !status.toLowerCase().includes('error') &&
        !status.toLowerCase().includes('failed') &&
        !status.toLowerCase().includes('disabled')
      );
    } catch {
      return false;
    }
  }

  /**
   * Wait for auto-load to complete (with WordPress fallback to local)
   */
  async waitForAutoLoadComplete(timeout: number = 15000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check if data is loaded
      const runnerCount = await this.getLoadedRunnersCount();
      if (runnerCount > 0) {
        // Data loaded, wait a moment for any loading indicators to disappear
        await this.page.waitForTimeout(500);
        return;
      }

      // Check for error state
      const errorMessage = await this.getWordPressErrorMessage();
      if (errorMessage) {
        // Has error, check if fallback is shown
        if (await this.isFallbackNoticeVisible()) {
          // Fallback notice is shown, which is acceptable
          return;
        }
      }

      await this.page.waitForTimeout(200);
    }

    throw new Error('Auto-load did not complete within timeout');
  }
}
