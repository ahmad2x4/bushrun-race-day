import { test, expect } from '@playwright/test';
import { VALID_TEST_CSV } from './fixtures/test-data';

test.describe('New Member Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Setup race by uploading CSV
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    const buffer = Buffer.from(VALID_TEST_CSV);
    await fileInput.setInputFiles({
      name: 'test-runners.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Wait for runners to be loaded
    await page.waitForSelector('text="John Smith"', { timeout: 10000 });

    // Start check-in process
    const startCheckinButton = page.locator('button').filter({ hasText: /start.*check.*in/i });
    await expect(startCheckinButton).toBeVisible();
    await startCheckinButton.click();

    // Verify we're on check-in view
    await expect(page.getByText('Runner Check-in')).toBeVisible();
  });

  test('should register a new member for 5km race', async ({ page }) => {
    // Given I am on the check-in page
    // When I click the "New" button
    await page.click('button[aria-label="Register new member"]');

    // Then the registration dialog should appear
    await expect(page.getByText('New Member Registration')).toBeVisible();

    // When I enter a name
    const memberName = 'Test Runner';
    await page.fill('input[type="text"]', memberName);

    // And select 5km distance (should be default)
    await expect(page.locator('button:has-text("5km")').first()).toHaveClass(/bg-blue-600/);

    // And click Register
    await page.click('button:has-text("Register")');

    // Then I should see the success screen with assigned number
    await expect(page.getByText('Registration Complete')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Your number is:')).toBeVisible();

    // And the temp number should be displayed (999 for first registration)
    const numberDisplay = page.locator('text=999').first();
    await expect(numberDisplay).toBeVisible();

    // And I should see instructions to tell timekeeper
    await expect(page.getByText(/tell this number to the timekeeper/i)).toBeVisible();

    // When I click Done
    await page.click('button:has-text("Done")');

    // Then the dialog should close
    await expect(page.getByText('New Member Registration')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Registration Complete')).not.toBeVisible();
  });

  test('should register a new member for 10km race', async ({ page }) => {
    // Given I am on the check-in page
    // When I click the "New" button
    await page.click('button[aria-label="Register new member"]');

    // Then the registration dialog should appear
    await expect(page.getByText('New Member Registration')).toBeVisible();

    // When I enter a name
    const memberName = 'Test Runner 10K';
    await page.fill('input[type="text"]', memberName);

    // And select 10km distance
    await page.click('button:has-text("10km")');
    await expect(page.locator('button:has-text("10km")').first()).toHaveClass(/bg-blue-600/);

    // Then the note should reflect 10km selection
    await expect(page.getByText(/checked in for 10km/i)).toBeVisible();

    // When I click Register
    await page.click('button:has-text("Register")');

    // Then I should see the success screen
    await expect(page.getByText('Registration Complete')).toBeVisible({ timeout: 5000 });

    // When I click Done
    await page.click('button:has-text("Done")');

    // Then the dialog should close
    await expect(page.getByText('New Member Registration')).not.toBeVisible({ timeout: 3000 });
  });

  test('should show validation error for empty name', async ({ page }) => {
    // Given I am on the check-in page
    // When I click the "New" button
    await page.click('button[aria-label="Register new member"]');

    // And I click Register without entering a name
    await page.click('button:has-text("Register")');

    // Then I should see a validation error
    await expect(page.getByText(/please enter a name/i)).toBeVisible();

    // And the dialog should remain open
    await expect(page.getByText('New Member Registration')).toBeVisible();
  });

  test('should cancel registration and close dialog', async ({ page }) => {
    // Given I am on the check-in page
    // When I click the "New" button
    await page.click('button[aria-label="Register new member"]');

    // Then the registration dialog should appear
    await expect(page.getByText('New Member Registration')).toBeVisible();

    // When I enter a name
    await page.fill('input[type="text"]', 'Test Cancel');

    // And click Cancel
    await page.click('button:has-text("Cancel")');

    // Then the dialog should close
    await expect(page.getByText('New Member Registration')).not.toBeVisible({ timeout: 3000 });
  });

  test('should assign decrementing temp numbers', async ({ page }) => {
    // Given I am on the check-in page
    // When I register the first new member
    await page.click('button[aria-label="Register new member"]');
    await page.fill('input[type="text"]', 'First Runner');
    await page.click('button:has-text("Register")');

    // Then I should see temp number 999
    await expect(page.getByText('Registration Complete')).toBeVisible({ timeout: 5000 });
    const firstNumber = page.locator('.text-6xl').first();
    await expect(firstNumber).toHaveText('999');

    // When I close the dialog and register a second member
    await page.click('button:has-text("Done")');
    await page.waitForTimeout(500); // Wait for dialog to close

    await page.click('button[aria-label="Register new member"]');
    await page.fill('input[type="text"]', 'Second Runner');
    await page.click('button:has-text("Register")');

    // Then I should see temp number 998
    await expect(page.getByText('Registration Complete')).toBeVisible({ timeout: 5000 });
    const secondNumber = page.locator('.text-6xl').first();
    await expect(secondNumber).toHaveText('998');

    await page.click('button:has-text("Done")');
  });

  test('should disable form inputs while submitting', async ({ page }) => {
    // Given I am on the check-in page
    await page.click('button[aria-label="Register new member"]');

    // When I enter a name and start registration
    await page.fill('input[type="text"]', 'Test Disabled');

    // Start the registration process
    const registerButton = page.locator('button:has-text("Register")');
    await registerButton.click();

    // Then the button text should change to "Registering..."
    await expect(page.getByText('Registering...')).toBeVisible();

    // And the form should be disabled
    const nameInput = page.locator('input[type="text"]');
    await expect(nameInput).toBeDisabled();
  });

  test('should work in dark mode', async ({ page }) => {
    // Given I am in dark mode
    await page.click('[aria-label="Toggle dark mode"]');

    // When I click the "New" button
    await page.click('button[aria-label="Register new member"]');

    // Then the dialog should appear with dark mode styling
    const dialog = page.locator('.dark\\:bg-gray-800').first();
    await expect(dialog).toBeVisible();

    // And all elements should be visible
    await expect(page.getByText('New Member Registration')).toBeVisible();

    // Cancel to clean up
    await page.click('button:has-text("Cancel")');
  });

  test('should reset form state when reopening dialog', async ({ page }) => {
    // Given I have entered data in the form
    await page.click('button[aria-label="Register new member"]');
    await page.fill('input[type="text"]', 'Test Reset');
    await page.click('button:has-text("10km")');

    // When I cancel and reopen
    await page.click('button:has-text("Cancel")');
    await page.click('button[aria-label="Register new member"]');

    // Then the form should be reset
    const nameInput = page.locator('input[type="text"]');
    await expect(nameInput).toHaveValue('');

    // And 5km should be selected by default
    await expect(page.locator('button:has-text("5km")').first()).toHaveClass(/bg-blue-600/);
  });

  test('should have accessible touch targets on mobile', async ({ page }) => {
    // Given I am on a mobile device
    await page.setViewportSize({ width: 375, height: 667 });

    // When I open the registration dialog
    await page.click('button[aria-label="Register new member"]');

    // Then all interactive elements should meet accessibility standards
    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
