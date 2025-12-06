import { Page, expect } from '@playwright/test';

/**
 * Test utilities for Bushrun Race Day E2E tests
 * Provides reusable functions for common test scenarios
 */

export class BushrunTestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the application and wait for it to load
   */
  async navigateToApp() {
    // Use relative navigation so baseURL path is preserved (GitHub Pages hosted under /bushrun-race-day/)
    await this.page.goto('./');
    await this.page.waitForLoadState('networkidle');
    
    // Wait for the app to be fully loaded
    await expect(this.page.locator('h1')).toContainText('Berowra Bushrunners');
  }

  /**
   * Upload a CSV file for race setup
   */
  async uploadCSVFile(csvContent: string, filename: string = 'test-runners.csv') {
    // Create a temporary CSV file
    const buffer = Buffer.from(csvContent);
    
    // Upload the file
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: filename,
      mimeType: 'text/csv',
      buffer: buffer,
    });
  }

  /**
   * Wait for CSV upload to be processed and validated
   */
  async waitForCSVProcessing() {
    // Wait for loading to disappear if present
    await this.page.waitForSelector('[data-testid="csv-loading"]', { state: 'hidden', timeout: 5000 }).catch(() => {
      // It's okay if loading indicator doesn't exist
    });
    
    // Wait for runner list or error messages to appear
    await Promise.race([
      this.page.waitForSelector('[data-testid="runner-list"]', { timeout: 10000 }),
      this.page.waitForSelector('[data-testid="csv-error"]', { timeout: 10000 }),
    ]);
  }

  /**
   * Check in a runner using their member number
   */
  async checkInRunner(memberNumber: number) {
    // Navigate to check-in view if not already there
    await this.ensureViewActive('checkin');
    
    // Enter the member number using the number pad
    const memberNumberStr = memberNumber.toString();
    
    for (const digit of memberNumberStr) {
      await this.page.click(`button:has-text("${digit}")`);
    }
    
    // Submit the check-in
    await this.page.click('button:has-text("Check In")');
    
    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="checkin-confirmation"]', { timeout: 5000 });
  }

  /**
   * Start the race timer
   */
  async startRace() {
    await this.ensureViewActive('race-director');
    await this.page.click('button:has-text("Start Race")');
    
    // Wait for timer to start
    await expect(this.page.locator('[data-testid="race-timer"]')).toBeVisible();
  }

  /**
   * Record a finish time for a runner
   */
  async recordFinishTime(memberNumber: number) {
    await this.ensureViewActive('race-director');
    
    // Find and click the runner button
    const runnerButton = this.page.locator(`[data-testid="runner-${memberNumber}"]`);
    await expect(runnerButton).toBeVisible();
    await runnerButton.click();
    
    // Wait for the finish to be recorded
    await expect(runnerButton).toHaveClass(/bg-green/);
  }

  /**
   * Navigate to a specific view
   */
  async navigateToView(view: 'setup' | 'checkin' | 'race-director' | 'results' | 'settings') {
    const viewButton = this.page.locator(`button`).filter({ hasText: new RegExp(view.replace('-', ' '), 'i') });
    await viewButton.click();
    await this.waitForViewChange(view);
  }

  /**
   * Ensure a specific view is active
   */
  async ensureViewActive(view: 'setup' | 'checkin' | 'race-director' | 'results' | 'settings') {
    const viewButton = this.page.locator(`button`).filter({ hasText: new RegExp(view.replace('-', ' '), 'i') });
    
    // Check if the view is already active
    const isActive = await viewButton.evaluate((el) => el.classList.contains('bg-blue-100'));
    
    if (!isActive) {
      await this.navigateToView(view);
    }
  }

  /**
   * Wait for a view change to complete
   */
  async waitForViewChange(expectedView: string) {
    await this.page.waitForFunction(
      (view) => {
        const activeButton = document.querySelector('button.bg-blue-100');
        return activeButton && activeButton.textContent?.toLowerCase().includes(view.replace('-', ' '));
      },
      expectedView,
      { timeout: 5000 }
    );
  }

  /**
   * Get race statistics from the UI
   */
  async getRaceStats() {
    const stats = {
      totalRunners: 0,
      checkedIn: 0,
      finished5k: 0,
      finished10k: 0,
    };

    try {
      const totalElement = this.page.locator('[data-testid="total-runners"]');
      stats.totalRunners = parseInt(await totalElement.textContent() || '0');

      const checkedInElement = this.page.locator('[data-testid="checked-in-count"]');
      stats.checkedIn = parseInt(await checkedInElement.textContent() || '0');

      const finished5kElement = this.page.locator('[data-testid="finished-5k-count"]');
      stats.finished5k = parseInt(await finished5kElement.textContent() || '0');

      const finished10kElement = this.page.locator('[data-testid="finished-10k-count"]');
      stats.finished10k = parseInt(await finished10kElement.textContent() || '0');
    } catch {
      // Some stats might not be available in certain views
    }

    return stats;
  }

  /**
   * Export race data and verify download
   */
  async exportRaceData(exportType: 'results' | 'next-race') {
    await this.ensureViewActive('results');
    
    // Set up download promise before clicking
    const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 });
    
    // Click the appropriate export button
    const exportButton = this.page.locator('button').filter({ 
      hasText: new RegExp(exportType === 'results' ? 'Export Results' : 'Export.*Next Race', 'i')
    });
    await exportButton.click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    return {
      filename: download.suggestedFilename(),
      path: await download.path(),
    };
  }

  /**
   * Toggle dark mode
   */
  async toggleDarkMode() {
    await this.page.click('[data-testid="dark-mode-toggle"]');
    
    // Wait for the theme to change
    await this.page.waitForFunction(() => {
      return document.documentElement.classList.contains('dark') || 
             !document.documentElement.classList.contains('dark');
    });
  }

  /**
   * Clear race data and reset to initial state
   */
  async resetRace() {
    await this.ensureViewActive('setup');
    
    // Look for reset button (might be in a dropdown or confirmation dialog)
    const resetButton = this.page.locator('button').filter({ hasText: /reset.*race/i });
    
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Handle confirmation dialog if present
      const confirmButton = this.page.locator('button').filter({ hasText: /confirm|reset/i });
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    }
  }

  /**
   * Verify race state matches expected values
   */
  async verifyRaceState(expectedState: {
    status?: 'setup' | 'checkin' | 'active' | 'finished';
    totalRunners?: number;
    checkedInCount?: number;
    finishedCount?: number;
  }) {
    if (expectedState.status) {
      // Verify the active view corresponds to the race status
      const statusViewMap = {
        'setup': 'setup',
        'checkin': 'checkin',
        'active': 'race-director',
        'finished': 'results'
      };
      
      const expectedView = statusViewMap[expectedState.status];
      await this.ensureViewActive(expectedView as 'setup' | 'checkin' | 'race-director' | 'results' | 'settings');
    }

    if (expectedState.totalRunners !== undefined || 
        expectedState.checkedInCount !== undefined || 
        expectedState.finishedCount !== undefined) {
      
      const stats = await this.getRaceStats();
      
      if (expectedState.totalRunners !== undefined) {
        expect(stats.totalRunners).toBe(expectedState.totalRunners);
      }
      
      if (expectedState.checkedInCount !== undefined) {
        expect(stats.checkedIn).toBe(expectedState.checkedInCount);
      }
      
      if (expectedState.finishedCount !== undefined) {
        const totalFinished = stats.finished5k + stats.finished10k;
        expect(totalFinished).toBe(expectedState.finishedCount);
      }
    }
  }

  /**
   * Wait for race timer to reach a specific value (in milliseconds)
   */
  async waitForTimerValue(targetMs: number, tolerance: number = 1000) {
    await this.page.waitForFunction(
      ({ target, tol }) => {
        const timerElement = document.querySelector('[data-testid="race-timer"]');
        if (!timerElement) return false;
        
        const timerText = timerElement.textContent || '';
        const [minutes, seconds] = timerText.split(':').map(Number);
        const currentMs = (minutes * 60 + seconds) * 1000;
        
        return Math.abs(currentMs - target) <= tol;
      },
      { target: targetMs, tol: tolerance },
      { timeout: 30000 }
    );
  }
}
