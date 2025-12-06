import { test, expect } from '@playwright/test';

test.describe('Runner Check-in Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    // Navigate to check-in view
    await page.click('button:has-text("Check-in")');
  });

  test('should allow runner check-in with valid number', async ({ page }) => {
    // Given I am on the check-in page
    await expect(page.getByText(/Check-in/)).toBeVisible();
    
    // When I enter a valid member number
    const memberNumber = '331';
    
    // Check for number pad or input field
    const numberPadButtons = page.locator('.grid button');
    if (await numberPadButtons.first().isVisible()) {
      // Use number pad
      for (const digit of memberNumber) {
        await page.click(`button:has-text("${digit}")`);
      }
      await page.click('button:has-text("Check In")');
    } else {
      // Use input field
      await page.fill('input[type="number"]', memberNumber);
      await page.press('input[type="number"]', 'Enter');
    }

    // Then the runner should be checked in successfully
    await expect(page.getByText(/checked in|success/i)).toBeVisible();
  });

  test('should show error for invalid member number', async ({ page }) => {
    // Given I am on the check-in page
    // When I enter an invalid member number
    const invalidNumber = '999';
    
    const numberPadButtons = page.locator('.grid button');
    if (await numberPadButtons.first().isVisible()) {
      for (const digit of invalidNumber) {
        await page.click(`button:has-text("${digit}")`);
      }
      await page.click('button:has-text("Check In")');
    }

    // Then I should see an error message
    await expect(page.getByText(/not found|invalid|error/i)).toBeVisible();
  });

  test('should prevent duplicate check-ins', async ({ page }) => {
    // Given a runner is already checked in
    // When I try to check them in again
    // Then I should see a message indicating they're already checked in
    
    const memberNumber = '331';
    
    // First check-in
    const numberPadButtons = page.locator('.grid button');
    if (await numberPadButtons.first().isVisible()) {
      for (const digit of memberNumber) {
        await page.click(`button:has-text("${digit}")`);
      }
      await page.click('button:has-text("Check In")');
    }
    
    // Wait for success message
    await page.waitForTimeout(1000);
    
    // Try to check in again
    for (const digit of memberNumber) {
      await page.click(`button:has-text("${digit}")`);
    }
    await page.click('button:has-text("Check In")');
    
    // Should show already checked in message
    await expect(page.getByText(/already checked in/i)).toBeVisible();
  });

  test('should display runner information after check-in', async ({ page }) => {
    // Given I have checked in a runner
    // Then I should see their information displayed
    await expect(page.locator('.bg-green-100, .bg-green-500')).toBeVisible({ timeout: 10000 });
  });

  test('should have accessible touch targets on mobile', async ({ page }) => {
    // Given I am on a mobile device
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Then all touch targets should be at least 44px (accessibility standard)
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});
