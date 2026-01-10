/**
 * Fetch Mock Utilities
 * Helper functions for mocking fetch in tests
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

/**
 * Setup default fetch mock that can be customized per test
 */
export const setupFetchMock = (): Mock => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch as unknown as typeof fetch;
  return mockFetch;
};

/**
 * Configure fetch mock to return success response
 */
export const mockFetchSuccess = (mockFetch: Mock, data: unknown, status = 200): void => {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    clone: () => ({
      ok: status >= 200 && status < 300,
      status,
      statusText: 'OK',
      json: async () => data,
      text: async () => JSON.stringify(data),
    }),
  } as unknown as Response);
};

/**
 * Configure fetch mock to return error response
 */
export const mockFetchError = (mockFetch: Mock, status: number, statusText = 'Error'): void => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
    json: async () => ({ error: statusText }),
    text: async () => statusText,
    blob: async () => new Blob([statusText]),
  } as unknown as Response);
};

/**
 * Configure fetch mock to reject with network error
 */
export const mockFetchNetworkError = (mockFetch: Mock, message = 'Failed to fetch'): void => {
  mockFetch.mockRejectedValueOnce(new Error(message));
};

/**
 * Configure fetch mock to timeout
 */
export const mockFetchTimeout = (mockFetch: Mock): void => {
  mockFetch.mockRejectedValueOnce(new Error('Request timeout'));
};

/**
 * Create a mock response for media list endpoint
 */
export const mockMediaListResponse = (items: unknown[] = []) => ({
  items,
  count: items.length,
});

/**
 * Create mock response for single media item
 */
export const mockMediaItemResponse = (item: unknown) => item;

/**
 * Setup fetch mock with conditional responses based on URL
 */
export const setupConditionalFetchMock = (): Mock => {
  const mockFetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/users/me')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 1, name: 'Test User' }),
      } as unknown as Response;
    }
    if (url.includes('/media') && init?.method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response;
    }
    if (url.includes('/media') && init?.method === 'POST') {
      return {
        ok: true,
        status: 201,
        json: async () => ({ id: 123, title: { rendered: 'test.csv' } }),
      } as unknown as Response;
    }
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as unknown as Response;
  });

  global.fetch = mockFetch as unknown as typeof fetch;
  return mockFetch;
};

/**
 * Reset fetch mock
 */
export const resetFetchMock = (): void => {
  if (global.fetch) {
    vi.resetAllMocks();
  }
};

/**
 * Assert fetch was called with specific arguments
 */
export const assertFetchCalled = (
  mockFetch: Mock,
  url: string,
  init?: RequestInit,
  callIndex = 0
): void => {
  const calls = mockFetch.mock.calls;
  expect(calls[callIndex]?.[0]).toBe(url);
  if (init) {
    expect(calls[callIndex]?.[1]).toMatchObject(init);
  }
};

/**
 * Get all fetch calls for inspection
 */
export const getFetchCalls = (mockFetch: Mock) => {
  return mockFetch.mock.calls;
};

/**
 * Clear fetch mock calls
 */
export const clearFetchCalls = (mockFetch: Mock): void => {
  mockFetch.mockClear();
};
