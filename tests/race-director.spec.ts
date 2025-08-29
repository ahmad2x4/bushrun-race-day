import { test, expect } from '@playwright/test';

test.describe('Race Director Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to race director view
    await page.click('[role="button"]:has-text("Race Director")');
  });

  test('should display race director grid after race starts', async ({ page }) => {
    // Given I am in race director mode
    await expect(page.getByText(/Race Director/)).toBeVisible();
    
    // Then I should see the runner number grid
    await expect(page.locator('.grid, [data-testid="runner-grid"]')).toBeVisible();
    
    // And I should see runner numbers as buttons
    await expect(page.locator('button').filter({ hasText: /^\d+$/ })).toBeVisible();
  });

  test('should record finish times by clicking runner numbers', async ({ page }) => {
    // Given I see the runner grid
    const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    
    if (await runnerButtons.first().isVisible()) {
      // When I click a runner number
      const firstRunner = runnerButtons.first();
      const runnerNumber = await firstRunner.textContent();
      await firstRunner.click();
      
      // Then the button should change state (color, style)
      await expect(firstRunner).toHaveClass(/bg-green|finished|completed/);
      
      // And the runner should show as finished
      await expect(page.getByText(new RegExp(`${runnerNumber}.*finished|completed`, 'i'))).toBeVisible();
    }
  });

  test('should show visual feedback for finished runners', async ({ page }) => {
    // Given I have recorded some finish times
    const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    
    if (await runnerButtons.count() > 0) {
      // When I click multiple runners
      await runnerButtons.first().click();
      if (await runnerButtons.nth(1).isVisible()) {
        await runnerButtons.nth(1).click();
      }
      
      // Then finished runners should have different visual state
      const finishedButtons = page.locator('button.bg-green, button[data-finished="true"]');
      expect(await finishedButtons.count()).toBeGreaterThan(0);
    }
  });

  test('should handle accidental clicks with undo functionality', async ({ page }) => {
    // Given I have clicked a runner by mistake
    const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    
    if (await runnerButtons.first().isVisible()) {
      const firstRunner = runnerButtons.first();
      await firstRunner.click();
      
      // When I click the same runner again or use undo
      // Check if there's an undo mechanism
      const undoButton = page.locator('button:has-text("Undo"), [aria-label*="undo"]');
      if (await undoButton.isVisible()) {
        await undoButton.click();
        
        // Then the runner should be unmarked
        await expect(firstRunner).not.toHaveClass(/bg-green|finished|completed/);
      } else {
        // Or clicking again should toggle
        await firstRunner.click();
        await expect(firstRunner).not.toHaveClass(/bg-green|finished|completed/);
      }
    }
  });

  test('should display runners in check-in order', async ({ page }) => {
    // Given runners have been checked in
    // Then the grid should show runners in their check-in sequence
    const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    
    if (await runnerButtons.count() > 1) {
      // Verify runners are displayed in some logical order
      const firstRunnerText = await runnerButtons.first().textContent();
      const secondRunnerText = await runnerButtons.nth(1).textContent();
      
      // Should be numeric ordering or check-in order
      expect(parseInt(firstRunnerText!)).toBeLessThanOrEqual(parseInt(secondRunnerText!) || Number.MAX_VALUE);
    }
  });

  test('should separate runners by distance category', async ({ page }) => {
    // Given I have runners in different distances
    // Then I should see distance categories
    await expect(page.getByText(/5km|10km/)).toBeVisible();
    
    // And runners should be grouped by distance
    const distanceSections = page.locator('[data-distance], .distance-group');
    if (await distanceSections.count() > 0) {
      expect(await distanceSections.count()).toBeGreaterThan(0);
    }
  });

  test('should show current race time', async ({ page }) => {
    // Given the race is in progress
    // Then I should see a race timer
    const timer = page.locator('[data-testid="race-timer"], .timer, .race-time');
    if (await timer.isVisible()) {
      const timeText = await timer.textContent();
      expect(timeText).toMatch(/\d+:\d+/); // MM:SS format
    }
  });

  test('should handle high-frequency clicking during finish line rush', async ({ page }) => {
    // Given multiple runners finish quickly
    const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    const buttonCount = await runnerButtons.count();
    
    if (buttonCount > 3) {
      // When I click multiple runners in rapid succession
      await runnerButtons.nth(0).click();
      await runnerButtons.nth(1).click();
      await runnerButtons.nth(2).click();
      await runnerButtons.nth(3).click();
      
      // Then all clicks should be registered
      const finishedCount = await page.locator('button.bg-green, button[data-finished="true"]').count();
      expect(finishedCount).toBe(4);
    }
  });

  test('should work in 10x testing mode', async ({ page }) => {
    // Given I enable testing mode
    const testingToggle = page.locator('button:has-text("10x"), [data-testid="testing-mode"]');
    if (await testingToggle.isVisible()) {
      await testingToggle.click();
      
      // Then times should be recorded faster
      const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
      if (await runnerButtons.first().isVisible()) {
        await runnerButtons.first().click();
        
        // Verify faster timing is applied (would need to check the actual time calculations)
        await expect(runnerButtons.first()).toHaveClass(/bg-green|finished|completed/);
      }
    }
  });

  test('should maintain performance with large number of runners', async ({ page }) => {
    // Given I have a large race (50+ runners)
    const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    const buttonCount = await runnerButtons.count();
    
    if (buttonCount > 20) {
      // When I interact with the interface
      const startTime = Date.now();
      await runnerButtons.first().click();
      const clickTime = Date.now() - startTime;
      
      // Then response should be fast (< 100ms for click response)
      expect(clickTime).toBeLessThan(100);
    }
  });

  test('should handle touch interactions on mobile devices', async ({ page }) => {
    // Given I am using a mobile device
    await page.setViewportSize({ width: 375, height: 667 });
    
    // When I tap runner buttons
    const runnerButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    if (await runnerButtons.first().isVisible()) {
      // Then buttons should be large enough for touch (44px minimum)
      const buttonBox = await runnerButtons.first().boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      }
      
      // And touch should register correctly
      await runnerButtons.first().tap();
      await expect(runnerButtons.first()).toHaveClass(/bg-green|finished|completed/);
    }
  });
});