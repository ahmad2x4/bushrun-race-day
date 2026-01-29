/**
 * WordPress E2E Test Fixtures
 * Mock data and test scenario builders for WordPress integration testing
 */

import { Page } from '@playwright/test';

/**
 * Mock WordPress media item response
 */
export const mockMediaItem = (overrides: Record<string, unknown> = {}) => ({
  id: 123,
  date: '2025-01-15T10:30:00',
  title: {
    rendered: 'bushrun-next-race-2025-01.csv',
  },
  source_url: 'https://example.com/wp-content/uploads/race.csv',
  mime_type: 'text/csv',
  description: {
    rendered: 'Race: Next Race (Month: 1, Year: 2025, Type: next_race)',
  },
  ...overrides,
});

/**
 * Mock CSV media items for list response
 */
export const mockCSVMediaItems = (count: number = 3) => {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(
      mockMediaItem({
        id: 100 + i,
        date: new Date(2025, 0, 15 - i).toISOString(),
        title: {
          rendered: `bushrun-next-race-2025-${String(1 - i).padStart(2, '0')}.csv`,
        },
      })
    );
  }
  return items;
};

/**
 * Mock WordPress media list endpoint response
 */
export const mockMediaListResponse = (items: unknown[] = []) => ({
  items,
  count: items.length,
});

/**
 * Valid test CSV content
 */
export const validCSVContent = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,is_official_5k,is_official_10k
101,Test Runner 1,true,5km,02:15,09:30,true,true
102,Test Runner 2,true,10km,03:45,11:00,true,true
103,Test Runner 3,false,5km,01:30,,true,false`;

/**
 * Season rollover CSV content
 */
export const seasonRolloverCSVContent = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,new_handicap_5k,new_handicap_10k,is_official_5k,is_official_10k
101,Test Runner 1,true,5km,02:15,09:30,02:20,09:35,true,true
102,Test Runner 2,true,10km,03:45,11:00,03:50,11:05,true,true
103,Test Runner 3,false,5km,01:30,,01:35,,true,false`;

/**
 * Test data for next race setup
 */
export const nextRaceTestData = {
  raceName: 'Next Race',
  raceDate: new Date().toISOString().split('T')[0],
  runners: [
    {
      member_number: 101,
      full_name: 'Alice Runner',
      is_financial_member: true,
      distance: '5km' as const,
      current_handicap_5k: '02:15',
    },
    {
      member_number: 102,
      full_name: 'Bob Jogger',
      is_financial_member: true,
      distance: '10km' as const,
      current_handicap_10k: '09:30',
    },
    {
      member_number: 103,
      full_name: 'Charlie Walker',
      is_financial_member: false,
      distance: '5km' as const,
      current_handicap_5k: '03:45',
    },
  ],
};

/**
 * Test data for season rollover
 */
export const seasonRolloverTestData = {
  raceName: 'Season Rollover',
  raceDate: new Date().toISOString().split('T')[0],
  runners: [
    {
      member_number: 101,
      full_name: 'Alice Runner',
      is_financial_member: true,
      distance: '5km' as const,
      current_handicap_5k: '02:15',
    },
    {
      member_number: 102,
      full_name: 'Bob Jogger',
      is_financial_member: true,
      distance: '10km' as const,
      current_handicap_10k: '09:30',
    },
  ],
};

/**
 * Setup WordPress mock responses based on scenario
 */
export async function setupWordPressMocks(
  page: Page,
  scenario: 'success' | 'timeout' | 'auth-failure' | 'connection-error'
) {
  await page.route('**/wp-json/wp/v2/media**', async (route) => {
    const request = route.request();

    switch (scenario) {
      case 'success':
        if (request.method() === 'POST') {
          // Upload response
          await route.abort('connectionclosed', {
            message: 'Request failed',
          });
          return;
        }
        // List response
        await route.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCSVMediaItems()),
        });
        break;

      case 'timeout':
        // Simulate timeout by delaying response
        await new Promise((resolve) => setTimeout(resolve, 35000));
        await route.abort('timedout');
        break;

      case 'auth-failure':
        await route.respond({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'rest_forbidden',
            message: 'Sorry, you are not allowed to do that.',
          }),
        });
        break;

      case 'connection-error':
        await route.abort('failed');
        break;

      default:
        await route.continue();
    }
  });
}

/**
 * Mock WordPress endpoint for successful CSV download
 */
export async function mockCSVDownload(page: Page, csvUrl: string) {
  await page.route(csvUrl, async (route) => {
    await route.respond({
      status: 200,
      contentType: 'text/csv',
      body: validCSVContent,
    });
  });
}

/**
 * Clear all WordPress mocks
 */
export async function clearWordPressMocks(page: Page) {
  await page.unroute('**/wp-json/wp/v2/**');
}

/**
 * Wait for WordPress loading indicator to disappear
 */
export async function waitForWordPressLoadingComplete(page: Page) {
  await page.waitForSelector('[data-testid="wordpress-loading"]', {
    state: 'hidden',
    timeout: 5000,
  });
}

/**
 * Simulate WordPress connection delay
 */
export async function delayWordPressResponse(page: Page, delayMs: number) {
  await page.route('**/wp-json/wp/v2/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Check if WordPress status badge shows connected
 */
export async function getWordPressStatus(page: Page): Promise<string> {
  const badge = await page.locator('[data-testid="wordpress-status"]').innerText();
  return badge;
}

/**
 * Verify WordPress credentials are configured
 */
export async function isWordPressConfigured(): boolean {
  return !!(
    process.env.VITE_WP_URL &&
    process.env.VITE_WP_USERNAME &&
    process.env.VITE_WP_APP_PASSWORD
  );
}

/**
 * Get current race date for testing
 */
export function getRaceDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get race month and year for testing
 */
export function getRaceMonthYear(): { month: number; year: number } {
  const today = new Date();
  return {
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  };
}

/**
 * Generate expected next race CSV filename
 */
export function getExpectedNextRaceFilename(month?: number, year?: number): string {
  const date = new Date();
  const m = (month ?? date.getMonth() + 1).toString().padStart(2, '0');
  const y = year ?? date.getFullYear();
  return `bushrun-next-race-${y}-${m}.csv`;
}

/**
 * Generate expected season rollover CSV filename
 */
export function getExpectedSeasonRolloverFilename(month?: number, year?: number): string {
  const date = new Date();
  const m = (month ?? date.getMonth() + 1).toString().padStart(2, '0');
  const y = year ?? date.getFullYear();
  return `bushrun-next-race-${y}-${m}-rollover.csv`;
}
