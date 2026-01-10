/**
 * WordPress HTTP Client
 * Handles all communication with WordPress REST API
 */

import { WordPressConfig } from './WordPressConfig';
import { WordPressAuthService } from './WordPressAuthService';
import type { ServiceResponse } from './types';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export class WordPressClient {
  private baseUrl: string;
  private timeout: number;

  constructor(timeout: number = DEFAULT_TIMEOUT) {
    const config = WordPressConfig.getInstance();
    const url = config.getUrl();

    if (!url) {
      throw new Error('WordPress URL not configured');
    }

    this.baseUrl = url;
    this.timeout = timeout;
  }

  /**
   * Perform GET request to WordPress API
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<ServiceResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, params);
      const headers = this.buildHeaders();

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Perform POST request to WordPress API
   */
  async post<T>(
    endpoint: string,
    body: FormData | Record<string, unknown>
  ): Promise<ServiceResponse<T>> {
    try {
      const url = this.buildUrl(endpoint);

      const requestInit: RequestInit = {
        method: 'POST',
      };

      if (body instanceof FormData) {
        // For FormData: only send Authorization header, let browser set Content-Type
        // (browser will set multipart/form-data with correct boundary)
        const authHeader = WordPressAuthService.createAuthHeader();
        requestInit.headers = authHeader;
        requestInit.body = body;
      } else {
        // For JSON: include full headers with Content-Type
        const headers = this.buildHeaders();
        requestInit.headers = headers;
        requestInit.body = JSON.stringify(body);
      }

      const response = await this.fetchWithTimeout(url, requestInit);

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Build full URL with optional query parameters
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string>
  ): string {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseUrl}/wp-json/wp/v2${cleanEndpoint}`;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}?${queryString}`;
    }

    return url;
  }

  /**
   * Build request headers
   */
  private buildHeaders(): Record<string, string> {
    const authHeader = WordPressAuthService.createAuthHeader();
    return {
      ...authHeader,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch with timeout
   */
  private fetchWithTimeout(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    return Promise.race([
      fetch(url, init),
      new Promise<Response>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          this.timeout
        )
      ),
    ]);
  }

  /**
   * Handle HTTP error responses
   */
  private handleErrorResponse(response: Response): ServiceResponse<unknown> {
    switch (response.status) {
      case 401:
      case 403:
        return {
          success: false,
          error: 'Authentication failed. Check your WordPress credentials.',
        };
      case 404:
        return {
          success: false,
          error: 'WordPress API endpoint not found. Check your WordPress version.',
        };
      case 500:
      case 502:
      case 503:
        return {
          success: false,
          error: 'WordPress server error. Try again later.',
        };
      default:
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
    }
  }

  /**
   * Handle errors (network, timeout, etc.)
   */
  private handleError(error: unknown): ServiceResponse<unknown> {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return {
        success: false,
        error: 'Request timed out. Check your WordPress URL and internet connection.',
      };
    }

    if (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError')
    ) {
      return {
        success: false,
        error: 'Network error. Check your internet connection and WordPress URL.',
      };
    }

    return {
      success: false,
      error: `Error: ${errorMessage}`,
    };
  }
}
