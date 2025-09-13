import { test, expect } from '@playwright/test';
import { VALID_TEST_CSV } from './fixtures/test-data';

/**
 * Complete Race Workflow E2E Test
 * Tests the entire race management flow from setup to results export
 * Following BDD (Given/When/Then) patterns
 */

test.describe('Complete Race Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Given I am on the Bushrun Race Day application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify the application loaded successfully
    await expect(page.locator('h1')).toContainText('Berowra Bushrunners');
  });

  test('should complete full race workflow: Setup → Check-in → Race → Results', async ({ page }) => {
    // PHASE 1: RACE SETUP
    // Given I am on the setup page
    await expect(page.locator('button').filter({ hasText: 'Setup' })).toHaveClass(/bg-blue-100/);
    
    // When I upload a valid CSV file with runner data
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Upload test CSV data
    const buffer = Buffer.from(VALID_TEST_CSV);
    await fileInput.setInputFiles({
      name: 'test-runners.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });
    
    // Then I should see the uploaded runners
    // Wait for CSV processing (look for either success or error indicators)
    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);
    
    // Verify runners are loaded
    await expect(page.locator('text="John Smith"')).toBeVisible();
    await expect(page.locator('text="Jane Doe"')).toBeVisible();
    
    // And I can start the check-in process
    const startCheckinButton = page.locator('button').filter({ hasText: /start.*check.*in/i });
    await expect(startCheckinButton).toBeVisible();
    await startCheckinButton.click();

    // PHASE 2: RUNNER CHECK-IN
    // Then I should be on the check-in view
    await expect(page.locator('button').filter({ hasText: 'Check-in' })).toHaveClass(/bg-blue-100/);
    
    // When I check in multiple runners using their member numbers
    const runnersToCheckIn = [331, 200, 150]; // Subset of test runners
    
    for (const memberNumber of runnersToCheckIn) {
      // Clear any previous input
      const clearButton = page.locator('button').filter({ hasText: 'Clear' });
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
      
      // Enter member number using number pad
      const memberNumberStr = memberNumber.toString();
      for (const digit of memberNumberStr) {
        await page.locator('button').filter({ hasText: new RegExp(`^${digit}$`) }).click();
      }
      
      // Submit check-in
      await page.locator('button').filter({ hasText: /check.*in/i }).click();
      
      // Wait for success confirmation
      await expect(page.locator(':text-matches("checked in", "i")').or(page.locator('[class*="text-green"]'))).toBeVisible({ timeout: 5000 });
    }

    // PHASE 3: RACE DIRECTOR VIEW  
    // When I navigate to the race director view
    await page.locator('button').filter({ hasText: /race.*director/i }).click();
    await expect(page.locator('button').filter({ hasText: /race.*director/i })).toHaveClass(/bg-blue-100/);

    // Then I should see the race controls
    const startRaceButton = page.locator('button').filter({ hasText: /start.*race/i });
    await expect(startRaceButton).toBeVisible();
    
    // When I start the race
    await startRaceButton.click();
    
    // Then the race timer should be running
    await expect(page.locator(':text-matches("00:", "i")').or(page.locator(':text-matches("0:", "i")'))).toBeVisible({ timeout: 5000 });
    
    // Wait a moment for the timer to start
    await page.waitForTimeout(2000);
    
    // And I should be able to record finish times
    // Look for runner buttons (they might have member numbers or names)
    const runnerButtons = page.locator('button').filter({ hasText: /331|John Smith/ });
    if (await runnerButtons.first().isVisible({ timeout: 5000 })) {
      await runnerButtons.first().click();
      
      // Verify the runner is marked as finished (green background or checkmark)
      await expect(runnerButtons.first()).toHaveClass(/bg-green|text-green/);
    }

    // PHASE 4: RESULTS VIEW
    // When all participants have finished or I navigate to results
    await page.locator('button').filter({ hasText: 'Results' }).click();
    await expect(page.locator('button').filter({ hasText: 'Results' })).toHaveClass(/bg-blue-100/);
    
    // Then I should see race results
    // Look for results indicators (podium, table, or summary)
    await Promise.race([
      page.locator(':text-matches("1st", "i")').waitFor({ timeout: 10000 }),
      page.locator(':text-matches("Position", "i")').waitFor({ timeout: 10000 }),
      page.locator('button').filter({ hasText: /calculate.*results/i }).waitFor({ timeout: 10000 }),
    ]);
    
    // If there's a calculate results button, click it
    const calculateButton = page.locator('button').filter({ hasText: /calculate.*results/i });
    if (await calculateButton.isVisible({ timeout: 2000 })) {
      await calculateButton.click();
      
      // Wait for calculations to complete
      await expect(page.locator(':text-matches("1st", "i")').or(page.locator(':text-matches("🥇", "i")'))).toBeVisible({ timeout: 10000 });
    }
    
    // And I should be able to export results
    const exportResultsButton = page.locator('button').filter({ hasText: /export.*results/i });
    if (await exportResultsButton.isVisible({ timeout: 5000 })) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      await exportResultsButton.click();
      
      // Wait for download to complete
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/results.*\.csv/i);
    }
  });

  test('should handle CSV upload errors gracefully', async ({ page }) => {
    // Given I am on the setup page
    await expect(page.locator('button').filter({ hasText: 'Setup' })).toHaveClass(/bg-blue-100/);
    
    // When I upload an invalid CSV file
    const invalidCSV = 'invalid,csv,format\nwithout,proper,headers';
    const buffer = Buffer.from(invalidCSV);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv', 
      buffer: buffer,
    });
    
    // Then I should see an error message
    await expect(page.locator('[class*="text-red"]').first()).toBeVisible({ timeout: 10000 });
    
    // And the file input should still be available for retry
    await expect(fileInput).toBeVisible();
  });

  test('should support mobile device interactions', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    // Given I am on the application on a mobile device
    await expect(page.locator('h1')).toContainText('Berowra Bushrunners');
    
    // When I upload test data (mobile file upload)
    const buffer = Buffer.from(VALID_TEST_CSV);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'mobile-test.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });
    
    // Then the mobile interface should be responsive
    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);
    
    // Navigate to check-in view for mobile testing
    const startCheckinButton = page.locator('button').filter({ hasText: /start.*check.*in/i });
    if (await startCheckinButton.isVisible({ timeout: 5000 })) {
      await startCheckinButton.click();
    }
    
    // Test mobile number pad interactions (fat finger friendly)
    const numberButton = page.locator('button').filter({ hasText: '3' }).first();
    if (await numberButton.isVisible({ timeout: 5000 })) {
      // Verify touch targets are large enough (at least 44px)
      const boundingBox = await numberButton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
      
      await numberButton.click();
    }
  });

  test('should maintain race state during navigation', async ({ page }) => {
    // Given I have uploaded race data
    const buffer = Buffer.from(VALID_TEST_CSV);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'state-test.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });
    
    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);
    
    // When I navigate between different views
    const views = ['Check-in', 'Race Director', 'Results', 'Settings'];
    
    for (const view of views) {
      const viewButton = page.locator('button').filter({ hasText: view });
      if (await viewButton.isVisible({ timeout: 2000 })) {
        await viewButton.click();
        
        // Verify the view is active
        await expect(viewButton).toHaveClass(/bg-blue-100/);
        
        // Small delay to allow view to render
        await page.waitForTimeout(500);
      }
    }
    
    // Then when I return to setup, the race data should still be there
    await page.locator('button').filter({ hasText: 'Setup' }).click();
    
    // Race data should persist (check for runner names or count)
    await expect(page.locator('text="John Smith"').or(page.locator(':text-matches("5 runners", "i")'))).toBeVisible({ timeout: 5000 });
  });
});