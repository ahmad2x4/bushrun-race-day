/**
 * ResultsPage Page Object Model
 * Handles interactions with the Results/Export view for WordPress upload testing
 */

import { Page, Locator } from '@playwright/test';

export class ResultsPage {
  private page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly exportSection: Locator;
  readonly nextRaceCSVButton: Locator;
  readonly seasonRolloverCSVButton: Locator;
  readonly uploadNextRaceButton: Locator;
  readonly uploadSeasonRolloverButton: Locator;
  readonly uploadStatus: Locator;
  readonly uploadError: Locator;
  readonly uploadSuccess: Locator;
  readonly uploadingSpinner: Locator;
  readonly resultsTable: Locator;
  readonly resultsTableRows: Locator;
  readonly nextRaceSection: Locator;
  readonly seasonRolloverSection: Locator;
  readonly downloadCSVButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page locators
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /results|export/i });
    this.exportSection = page.locator('[data-testid="export-section"]');

    // CSV export buttons
    this.nextRaceCSVButton = page.locator('button:has-text("Next Race CSV"), button:has-text("Download Next Race CSV")');
    this.seasonRolloverCSVButton = page.locator('button:has-text("Season Rollover CSV"), button:has-text("Download Season Rollover CSV")');

    // Upload to WordPress buttons
    this.uploadNextRaceButton = page.locator('button:has-text("Upload to WordPress"):near(${this.nextRaceCSVButton})');
    this.uploadSeasonRolloverButton = page.locator('button:has-text("Upload to WordPress"):near(${this.seasonRolloverCSVButton})');

    // Status and feedback locators
    this.uploadStatus = page.locator('[data-testid="upload-status"]');
    this.uploadError = page.locator('[data-testid="upload-error"]');
    this.uploadSuccess = page.locator('[data-testid="upload-success"]');
    this.uploadingSpinner = page.locator('[data-testid="uploading-spinner"]');

    // Results display locators
    this.resultsTable = page.locator('[data-testid="results-table"], table');
    this.resultsTableRows = page.locator('[data-testid="results-table"] tbody tr, table tbody tr');

    // Section locators
    this.nextRaceSection = page.locator('[data-testid="next-race-section"]');
    this.seasonRolloverSection = page.locator('[data-testid="season-rollover-section"]');

    // Alternative button locators
    this.downloadCSVButton = page.locator('button[title*="Download"], button:has-text("Download")');
  }

  /**
   * Navigate to results page
   */
  async navigate(): Promise<void> {
    await this.page.goto('/results');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for results page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 5000 });
    await this.exportSection.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Check if next race section is visible
   */
  async isNextRaceSectionVisible(): Promise<boolean> {
    try {
      await this.nextRaceSection.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if season rollover section is visible
   */
  async isSeasonRolloverSectionVisible(): Promise<boolean> {
    try {
      await this.seasonRolloverSection.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click button to generate next race CSV
   */
  async generateNextRaceCSV(): Promise<void> {
    await this.nextRaceCSVButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click button to generate season rollover CSV
   */
  async generateSeasonRolloverCSV(): Promise<void> {
    await this.seasonRolloverCSVButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click upload next race to WordPress
   */
  async uploadNextRaceToWordPress(): Promise<void> {
    // First generate the CSV if not already generated
    await this.nextRaceCSVButton.click();
    await this.page.waitForTimeout(500);

    // Then click upload button
    await this.uploadNextRaceButton.click();
  }

  /**
   * Click upload season rollover to WordPress
   */
  async uploadSeasonRolloverToWordPress(): Promise<void> {
    // First generate the CSV if not already generated
    await this.seasonRolloverCSVButton.click();
    await this.page.waitForTimeout(500);

    // Then click upload button
    await this.uploadSeasonRolloverButton.click();
  }

  /**
   * Wait for upload to complete
   */
  async waitForUploadComplete(timeout: number = 10000): Promise<void> {
    // Wait for uploading spinner to appear and disappear
    try {
      await this.uploadingSpinner.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      // Spinner might not appear if upload is fast
    }

    // Wait for spinner to disappear
    await this.uploadingSpinner.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Check if upload was successful
   */
  async wasUploadSuccessful(): Promise<boolean> {
    try {
      await this.uploadSuccess.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get upload status message
   */
  async getUploadStatus(): Promise<string | null> {
    try {
      await this.uploadStatus.waitFor({ state: 'visible', timeout: 2000 });
      return await this.uploadStatus.innerText();
    } catch {
      return null;
    }
  }

  /**
   * Check if upload failed
   */
  async didUploadFail(): Promise<boolean> {
    try {
      await this.uploadError.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get upload error message
   */
  async getUploadErrorMessage(): Promise<string | null> {
    try {
      await this.uploadError.waitFor({ state: 'visible', timeout: 2000 });
      return await this.uploadError.innerText();
    } catch {
      return null;
    }
  }

  /**
   * Get upload success message
   */
  async getUploadSuccessMessage(): Promise<string | null> {
    try {
      await this.uploadSuccess.waitFor({ state: 'visible', timeout: 2000 });
      return await this.uploadSuccess.innerText();
    } catch {
      return null;
    }
  }

  /**
   * Get number of results rows displayed
   */
  async getResultsRowCount(): Promise<number> {
    return await this.resultsTableRows.count();
  }

  /**
   * Get results data from table
   */
  async getResultsData(): Promise<Record<string, string>[]> {
    const rows = await this.resultsTableRows.count();
    const headers = await this.page.locator('thead th').allInnerTexts();

    const data: Record<string, string>[] = [];

    for (let i = 0; i < rows; i++) {
      const cells = await this.page.locator(`tbody tr:nth-child(${i + 1}) td`).allInnerTexts();
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = cells[index] || '';
      });

      data.push(row);
    }

    return data;
  }

  /**
   * Verify results table has expected structure
   */
  async verifyResultsTableStructure(): Promise<boolean> {
    try {
      await this.resultsTable.waitFor({ state: 'visible', timeout: 2000 });
      const rows = await this.getResultsRowCount();
      return rows > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get table headers
   */
  async getTableHeaders(): Promise<string[]> {
    return await this.page.locator('thead th').allInnerTexts();
  }

  /**
   * Verify next race upload button is enabled
   */
  async isNextRaceUploadButtonEnabled(): Promise<boolean> {
    try {
      const isDisabled = await this.uploadNextRaceButton.isDisabled();
      return !isDisabled;
    } catch {
      return false;
    }
  }

  /**
   * Verify season rollover upload button is enabled
   */
  async isSeasonRolloverUploadButtonEnabled(): Promise<boolean> {
    try {
      const isDisabled = await this.uploadSeasonRolloverButton.isDisabled();
      return !isDisabled;
    } catch {
      return false;
    }
  }

  /**
   * Wait for upload to complete and verify success
   */
  async uploadAndVerify(
    uploadType: 'nextRace' | 'seasonRollover',
    timeout: number = 10000
  ): Promise<boolean> {
    if (uploadType === 'nextRace') {
      await this.uploadNextRaceToWordPress();
    } else {
      await this.uploadSeasonRolloverToWordPress();
    }

    await this.waitForUploadComplete(timeout);
    return await this.wasUploadSuccessful();
  }

  /**
   * Check if WordPress upload feature is available
   */
  async isWordPressUploadAvailable(): Promise<boolean> {
    try {
      return (
        (await this.uploadNextRaceButton.isVisible()) ||
        (await this.uploadSeasonRolloverButton.isVisible())
      );
    } catch {
      return false;
    }
  }

  /**
   * Get all upload status messages visible on page
   */
  async getAllUploadStatuses(): Promise<string[]> {
    return await this.page.locator('[data-testid="upload-status"]').allInnerTexts();
  }

  /**
   * Wait for both upload sections to be ready
   */
  async waitForExportSectionsReady(timeout: number = 5000): Promise<void> {
    await this.exportSection.waitFor({ state: 'visible', timeout });
    await this.page.waitForLoadState('networkidle');
  }
}
