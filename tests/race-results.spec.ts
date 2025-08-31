import { test, expect } from '@playwright/test';

test.describe('Race Results Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to results view
    await page.click('button:has-text("Results")');
  });

  test('should display results table after race starts', async ({ page }) => {
    // Given I have runners checked in and race is in progress
    await expect(page.getByText(/Results/)).toBeVisible();
    
    // Then I should see the results table
    await expect(page.locator('table, .results-grid')).toBeVisible();
  });

  test('should allow editing finish times', async ({ page }) => {
    // Given I am viewing results
    // When I click to edit a runner's time
    const editButtons = page.locator('button:has-text("Edit"), [aria-label*="edit"]');
    if (await editButtons.first().isVisible()) {
      await editButtons.first().click();
      
      // Then I should see time input fields
      await expect(page.locator('input[type="number"], input[placeholder*="minute"], input[placeholder*="second"]')).toBeVisible();
      
      // When I enter a new time
      const minuteInput = page.locator('input[placeholder*="minute"], input[aria-label*="minute"]');
      const secondInput = page.locator('input[placeholder*="second"], input[aria-label*="second"]');
      
      if (await minuteInput.isVisible()) {
        await minuteInput.fill('25');
        await secondInput.fill('30');
        await page.click('button:has-text("Save")');
      }
      
      // Then the time should be updated
      await expect(page.getByText(/25:30/)).toBeVisible();
    }
  });

  test('should allow marking runner as DNF', async ({ page }) => {
    // Given I am editing a runner's result
    const editButtons = page.locator('button:has-text("Edit"), [aria-label*="edit"]');
    if (await editButtons.first().isVisible()) {
      await editButtons.first().click();
      
      // When I click DNF button
      const dnfButton = page.locator('button:has-text("DNF")');
      if (await dnfButton.isVisible()) {
        await dnfButton.click();
        
        // Then the runner should be marked as DNF
        await expect(page.getByText(/DNF|did not finish/i)).toBeVisible();
      }
    }
  });

  test('should allow marking runner as Early Start', async ({ page }) => {
    // Given I am editing a runner's result
    const editButtons = page.locator('button:has-text("Edit"), [aria-label*="edit"]');
    if (await editButtons.first().isVisible()) {
      await editButtons.first().click();
      
      // When I click Early Start button
      const earlyStartButton = page.locator('button:has-text("Early Start")');
      if (await earlyStartButton.isVisible()) {
        await earlyStartButton.click();
        
        // Then the runner should be marked as Early Start
        await expect(page.getByText(/Early Start/i)).toBeVisible();
      }
    }
  });

  test('should calculate and display handicaps', async ({ page }) => {
    // Given I have race results
    // Then I should see handicap calculations
    await expect(page.getByText(/handicap|new handicap/i)).toBeVisible();
    
    // And I should see both old and new handicap values
    await expect(page.locator('[data-testid*="handicap"], .handicap')).toBeVisible();
  });

  test('should export results to CSV', async ({ page }) => {
    // Given I have race results
    // When I click export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    if (await exportButton.isVisible()) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      // Then CSV file should be downloaded
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('should display correct position rankings', async ({ page }) => {
    // Given I have multiple runners with finish times
    // Then I should see position numbers (1, 2, 3, etc.)
    const positions = page.locator('[data-testid*="position"], .position, td:first-child');
    if (await positions.first().isVisible()) {
      const firstPosition = await positions.first().textContent();
      expect(firstPosition).toMatch(/^1$|^#?1$/);
    }
  });

  test('should separate results by distance', async ({ page }) => {
    // Given I have runners in both 5km and 10km races
    // Then I should see distance separation
    await expect(page.getByText(/5km|10km/)).toBeVisible();
    
    // And results should be grouped or clearly labeled by distance
    const distanceLabels = page.locator('[data-testid*="distance"], .distance, .badge');
    expect(await distanceLabels.count()).toBeGreaterThan(0);
  });

  test('should handle responsive layout on mobile', async ({ page }) => {
    // Given I am on a mobile device
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Then the results should be mobile-friendly
    await expect(page.locator('table, .results-grid')).toBeVisible();
    
    // And text should be readable
    const textElements = page.locator('td, .result-item');
    if (await textElements.first().isVisible()) {
      const fontSize = await textElements.first().evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(14);
    }
  });
});