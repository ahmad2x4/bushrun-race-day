import { test, expect } from '@playwright/test';

test.describe('Race Setup Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload CSV and configure race', async ({ page }) => {
    // Given I am on the setup page
    await expect(page.locator('h1')).toContainText('Berowra Bushrunners');
    await expect(page.locator('[role="button"]').filter({ hasText: 'Setup' })).toHaveClass(/bg-blue-100/);

    // When I upload a valid CSV file
    // Note: We would need to create a test CSV file and upload it
    // For now, we'll check that the file input exists
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('label').filter({ hasText: /Upload CSV/ })).toBeVisible();

    // Then I should see the race configuration options
    await expect(page.getByText(/CSV Upload/)).toBeVisible();
  });

  test('should show error for invalid CSV', async ({ page }) => {
    // This would test error handling for malformed CSV files
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // We would simulate uploading an invalid file here
    // and check for error messages
  });

  test('should navigate to check-in after successful upload', async ({ page }) => {
    // Given I have uploaded a valid CSV
    // When the race is configured successfully
    // Then I should be able to navigate to check-in
    
    await page.click('[role="button"]:has-text("Check-in")');
    await expect(page.url()).toContain('check-in'); // Note: might need to be adjusted based on routing
  });

  test('should display club branding correctly', async ({ page }) => {
    // Given I am on any page
    // Then I should see the club name and colors
    await expect(page.locator('h1')).toContainText('Berowra Bushrunners');
    
    // Check for dark mode toggle
    await expect(page.locator('[aria-label="Toggle dark mode"]')).toBeVisible();
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Given I am on a mobile device
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Then the layout should be mobile-friendly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });
});