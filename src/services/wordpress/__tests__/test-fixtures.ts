/**
 * Test Fixtures & Utilities
 * Shared test data factories and helper functions for WordPress integration tests
 */

import { vi } from 'vitest';
import type { MediaItem, CSVMetadata } from '../types';

/**
 * Mock MediaItem factory - creates a valid WordPress media item
 */
export const createMockMediaItem = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: 123,
  date: '2025-01-01T00:00:00',
  title: {
    rendered: 'bushrun-next-race-2025-01.csv',
  },
  source_url: 'https://example.com/wp-content/uploads/race.csv',
  mime_type: 'text/csv',
  ...overrides,
});

/**
 * Mock CSVMetadata factory - creates valid race metadata
 */
export const createMockCSVMetadata = (overrides: Partial<CSVMetadata> = {}): CSVMetadata => ({
  race_name: 'Test Race',
  race_date: '2025-01-15',
  race_month: 1,
  race_year: 2025,
  csv_type: 'next_race',
  is_season_rollover: false,
  ...overrides,
});

/**
 * Set environment variables for testing
 * Stubs import.meta.env for the test
 */
export const setEnv = (vars: Record<string, string | undefined>) => {
  const env = {
    VITE_WP_URL: undefined,
    VITE_WP_USERNAME: undefined,
    VITE_WP_APP_PASSWORD: undefined,
    ...vars,
  };
  vi.stubGlobal('import.meta', {
    env,
  });
};

/**
 * Reset environment variables to defaults (disabled state)
 */
export const resetEnv = () => {
  setEnv({
    VITE_WP_URL: undefined,
    VITE_WP_USERNAME: undefined,
    VITE_WP_APP_PASSWORD: undefined,
  });
};

/**
 * Create a mock successful fetch response
 */
export const mockFetchResponse = <T>(data: T, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: async () => data,
  text: async () => JSON.stringify(data),
  blob: async () => new Blob([JSON.stringify(data)]),
  clone: () => mockFetchResponse(data, status),
  headers: new Headers(),
  type: 'basic',
  url: '',
  redirected: false,
  trailer: Promise.resolve(new Headers()),
  arrayBuffer: async () => new ArrayBuffer(0),
  formData: async () => new FormData(),
} as unknown as Response);

/**
 * Create a mock error fetch response
 */
export const mockErrorResponse = (status: number, statusText = 'Error'): Response => ({
  ok: false,
  status,
  statusText,
  json: async () => ({ error: statusText }),
  text: async () => statusText,
  blob: async () => new Blob([statusText]),
  clone: () => mockErrorResponse(status, statusText),
  headers: new Headers(),
  type: 'basic',
  url: '',
  redirected: false,
  trailer: Promise.resolve(new Headers()),
  arrayBuffer: async () => new ArrayBuffer(0),
  formData: async () => new FormData(),
} as unknown as Response);

/**
 * Valid environment configuration for testing
 */
export const VALID_ENV = {
  VITE_WP_URL: 'https://example.com',
  VITE_WP_USERNAME: 'testuser',
  VITE_WP_APP_PASSWORD: 'testpass123',
};

/**
 * Mock CSV content for testing
 */
export const MOCK_CSV_CONTENT = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,is_official_5k,is_official_10k
105,Test Runner 1,true,5km,02:15,09:30,true,true
106,Test Runner 2,true,10km,03:45,11:00,true,true
107,Test Runner 3,false,5km,01:30,,true,false`;

/**
 * Valid test filenames for filename parser tests
 */
export const VALID_FILENAMES = [
  {
    filename: 'bushrun-next-race-2025-01.csv',
    year: 2025,
    month: 1,
    isSeasonRollover: false,
  },
  {
    filename: 'bushrun-next-race-2025-12.csv',
    year: 2025,
    month: 12,
    isSeasonRollover: false,
  },
  {
    filename: 'bushrun-next-race-2025-01-rollover.csv',
    year: 2025,
    month: 1,
    isSeasonRollover: true,
  },
  {
    filename: 'BUSHRUN-NEXT-RACE-2025-06.csv',
    year: 2025,
    month: 6,
    isSeasonRollover: false,
  },
];

/**
 * Invalid test filenames for filename parser tests
 */
export const INVALID_FILENAMES = [
  'bushrun-next-race-2025.csv', // Missing month
  'bushrun-next-race-2025-13.csv', // Invalid month
  'bushrun-next-race-2025-00.csv', // Invalid month
  'bushrun-race-2025-01.csv', // Wrong pattern
  'race-2025-01.csv', // Missing prefix
  'bushrun-next-race-01.csv', // Missing year
  'bushrun-next-race-2025-1.csv', // Month not padded
  'bushrun-next-race-2025-01', // Missing extension
  'bushrun-next-race-2025-01.txt', // Wrong extension
];

/**
 * HTTP error scenarios for testing
 */
export const HTTP_ERROR_SCENARIOS = [
  { status: 400, message: 'API error' },
  { status: 401, message: 'Authentication failed' },
  { status: 403, message: 'Authentication failed' },
  { status: 404, message: 'API endpoint not found' },
  { status: 500, message: 'WordPress server error' },
  { status: 502, message: 'WordPress server error' },
  { status: 503, message: 'WordPress server error' },
];

/**
 * Month/year combinations for testing backward search
 */
export const MONTH_YEAR_TEST_CASES = [
  { target: { month: 1, year: 2025 }, found: { month: 12, year: 2024 } }, // Jan -> Dec prev year
  { target: { month: 3, year: 2025 }, found: { month: 2, year: 2025 } }, // Mar -> Feb same year
  { target: { month: 2, year: 2025 }, found: { month: 1, year: 2025 } }, // Feb -> Jan same year
  { target: { month: 7, year: 2025 }, found: { month: 6, year: 2025 } }, // Jul -> Jun same year
  { target: { month: 12, year: 2024 }, found: { month: 11, year: 2024 } }, // Dec -> Nov same year
];

/**
 * Test data for base64 encoding verification
 */
export const BASE64_TEST_CASES = [
  {
    input: 'admin:password123',
    expectedOutput: 'YWRtaW46cGFzc3dvcmQxMjM=',
  },
  {
    input: 'testuser:testpass',
    expectedOutput: 'dGVzdHVzZXI6dGVzdHBhc3M=',
  },
  {
    input: 'user@example.com:p@ss!word',
    expectedOutput: 'dXNlckBleGFtcGxlLmNvbTpwQHNzIXdvcmQ=',
  },
];

/**
 * Mock Runner object for testing
 */
export const createMockRunner = (overrides: Record<string, unknown> = {}) => ({
  member_number: 101,
  full_name: 'Test Runner',
  is_financial_member: true,
  distance: '5km' as const,
  current_handicap_5k: '02:15',
  checked_in: false,
  ...overrides,
});

/**
 * Mock Race object for testing
 */
export const createMockRace = (overrides: Record<string, unknown> = {}) => ({
  id: `race-${Date.now()}`,
  name: 'Test Race',
  date: '2025-01-15',
  status: 'setup' as const,
  runners: [
    createMockRunner({ member_number: 105, full_name: 'Runner 1' }),
    createMockRunner({ member_number: 106, full_name: 'Runner 2' }),
  ],
  race_5k_active: false,
  race_10k_active: false,
  next_temp_number: 999,
  ...overrides,
});
