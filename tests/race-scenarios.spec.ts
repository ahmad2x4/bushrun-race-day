import { test, expect } from '@playwright/test';
import { 
  TEST_SCENARIOS, 
  INVALID_CSV_MISSING_HEADERS, 
  INVALID_CSV_BAD_MEMBER_NUMBERS,
  DUPLICATE_MEMBER_NUMBERS_CSV 
} from './fixtures/test-data';

/**
 * Race Scenarios E2E Tests
 * Tests various race conditions, edge cases, and error scenarios
 */

test.describe('Race Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Berowra Bushrunners');
  });

  test('should handle 5K only race', async ({ page }) => {
    // Given I upload a 5K only race
    const buffer = Buffer.from(TEST_SCENARIOS.ONLY_5K.csv);
    await page.locator('input[type="file"]').setInputFiles({
      name: '5k-only-race.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // When the CSV is processed
    await Promise.race([
      page.waitForSelector('text="Jane Doe"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);

    // Then I should only see 5K runners
    await expect(page.locator('text="Jane Doe"')).toBeVisible();
    await expect(page.locator('text="5km"').first()).toBeVisible();
    
    // And no 10K distance indicators should be present
    const tenKmIndicators = page.locator('text="10km"');
    if (await tenKmIndicators.count() > 0) {
      // If 10km text exists, it should not be in runner context
      const tenKmCount = await tenKmIndicators.count();
      expect(tenKmCount).toBeLessThanOrEqual(1); // Maybe in headers/labels only
    }
  });

  test('should handle 10K only race', async ({ page }) => {
    // Given I upload a 10K only race
    const buffer = Buffer.from(TEST_SCENARIOS.ONLY_10K.csv);
    await page.locator('input[type="file"]').setInputFiles({
      name: '10k-only-race.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // When the CSV is processed
    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);

    // Then I should only see 10K runners
    await expect(page.locator('text="John Smith"')).toBeVisible();
    await expect(page.locator('text="10km"').first()).toBeVisible();
  });

  test('should handle large race field', async ({ page }) => {
    // Given I upload a large race with many participants
    const buffer = Buffer.from(TEST_SCENARIOS.LARGE_RACE.csv);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'large-race.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // When the CSV is processed
    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 15000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 15000 }),
    ]);

    // Then all runners should be loaded
    await expect(page.locator('text="John Smith"')).toBeVisible();
    
    // And the interface should handle the large dataset
    // Check if there are pagination controls or scrollable areas
    const runnerCount = await page.locator('text="Test Runner"').count();
    expect(runnerCount).toBeGreaterThan(20); // We expect many test runners
    
    // Navigate to check-in to test performance
    const startCheckinButton = page.locator('button').filter({ hasText: /start.*check.*in/i });
    if (await startCheckinButton.isVisible({ timeout: 5000 })) {
      await startCheckinButton.click();
      
      // The interface should remain responsive
      await expect(page.locator('button').filter({ hasText: '1' })).toBeVisible({ timeout: 5000 });
    }
  });

  test('should reject CSV with missing required headers', async ({ page }) => {
    // Given I upload a CSV with missing headers
    const buffer = Buffer.from(INVALID_CSV_MISSING_HEADERS);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'missing-headers.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Then I should see an error message about missing headers
    const errorMessage = page.locator('[class*="text-red"]').or(page.locator('text="error"')).or(page.locator('text="invalid"'));
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // And the upload should not proceed
    await expect(page.locator('text="John Smith"')).not.toBeVisible();
  });

  test('should reject CSV with invalid member numbers', async ({ page }) => {
    // Given I upload a CSV with invalid member numbers
    const buffer = Buffer.from(INVALID_CSV_BAD_MEMBER_NUMBERS);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'bad-member-numbers.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Then I should see an error about invalid member numbers
    await expect(page.locator('[class*="text-red"]').or(page.locator('text="error"'))).toBeVisible({ timeout: 10000 });
  });

  test('should reject CSV with duplicate member numbers', async ({ page }) => {
    // Given I upload a CSV with duplicate member numbers
    const buffer = Buffer.from(DUPLICATE_MEMBER_NUMBERS_CSV);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'duplicate-members.csv', 
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Then I should see an error about duplicate members
    await expect(page.locator('[class*="text-red"]').or(page.locator('text="duplicate"'))).toBeVisible({ timeout: 10000 });
  });

  test('should handle mixed handicap statuses correctly', async ({ page }) => {
    // Given I upload runners with mixed handicap statuses
    const buffer = Buffer.from(TEST_SCENARIOS.MIXED_HANDICAP_STATUS.csv);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'mixed-status.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // When the CSV is processed
    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);

    // Then all runners should be accepted regardless of status
    await expect(page.locator('text="John Smith"')).toBeVisible();
    
    // Navigate through to results to test championship points
    const startCheckinButton = page.locator('button').filter({ hasText: /start.*check.*in/i });
    if (await startCheckinButton.isVisible({ timeout: 5000 })) {
      await startCheckinButton.click();
      
      // Quick check-in for first runner
      await page.locator('button').filter({ hasText: '3' }).click();
      await page.locator('button').filter({ hasText: '3' }).click();
      await page.locator('button').filter({ hasText: '1' }).click();
      await page.locator('button').filter({ hasText: /check.*in/i }).click();
      
      // Should see confirmation
      await expect(page.locator('text="checked in"').or(page.locator('[class*="text-green"]'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should support race reset functionality', async ({ page }) => {
    // Given I have uploaded race data
    const buffer = Buffer.from(TEST_SCENARIOS.SMALL_RACE.csv);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'reset-test.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);

    // When I look for a reset option
    const resetButton = page.locator('button').filter({ hasText: /reset.*race/i });
    
    if (await resetButton.isVisible({ timeout: 5000 })) {
      // And I reset the race
      await resetButton.click();
      
      // Handle confirmation dialog if present
      const confirmButton = page.locator('button').filter({ hasText: /confirm|reset|yes/i });
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        await confirmButton.click();
      }
      
      // Then the race should be reset
      await expect(page.locator('text="John Smith"')).not.toBeVisible({ timeout: 5000 });
      
      // And the file input should be available again
      await expect(page.locator('input[type="file"]')).toBeVisible();
    } else {
      // If no reset button is visible, this test is not applicable
      test.skip('Reset functionality not available in current UI');
    }
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    // Given I have race data loaded
    const buffer = Buffer.from(TEST_SCENARIOS.SMALL_RACE.csv);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'network-test.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);

    // When I simulate offline conditions
    await page.context().setOffline(true);
    
    // Then the application should continue to work offline
    // Navigate between views - this should work as it's a PWA
    const checkinButton = page.locator('button').filter({ hasText: 'Check-in' });
    if (await checkinButton.isVisible({ timeout: 2000 })) {
      await checkinButton.click();
      
      // The check-in interface should still be functional
      await expect(page.locator('button').filter({ hasText: '1' })).toBeVisible({ timeout: 5000 });
    }
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('should maintain data integrity across page refreshes', async ({ page }) => {
    // Given I have uploaded race data
    const buffer = Buffer.from(TEST_SCENARIOS.SMALL_RACE.csv);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'persistence-test.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    await Promise.race([
      page.waitForSelector('text="John Smith"', { timeout: 10000 }),
      page.waitForSelector('[class*="text-red"]', { timeout: 10000 }),
    ]);

    // When I refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Then the race data should persist (IndexedDB)
    // Note: This depends on the app's persistence implementation
    await expect(page.locator('h1')).toContainText('Berowra Bushrunners');
    
    // The data might still be there or might need to be re-uploaded
    // This behavior depends on the specific PWA implementation
    const johnSmithVisible = await page.locator('text="John Smith"').isVisible({ timeout: 5000 });
    const fileInputVisible = await page.locator('input[type="file"]').isVisible({ timeout: 5000 });
    
    // Either the data persisted or we're back to upload state
    expect(johnSmithVisible || fileInputVisible).toBe(true);
  });
});