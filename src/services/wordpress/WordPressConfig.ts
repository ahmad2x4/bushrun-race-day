/**
 * WordPress Configuration Service
 * Manages loading and validating WordPress credentials from environment variables
 */

import type { WordPressConfigType } from './types';

export class WordPressConfig {
  private static instance: WordPressConfig;
  private config: WordPressConfigType | null = null;
  private isEnabledFlag = false;

  private constructor() {
    this.loadAndValidateConfig();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WordPressConfig {
    if (!WordPressConfig.instance) {
      WordPressConfig.instance = new WordPressConfig();
    }
    return WordPressConfig.instance;
  }

  /**
   * Load and validate configuration from environment variables
   */
  private loadAndValidateConfig(): void {
    const url = import.meta.env.VITE_WP_URL;
    const username = import.meta.env.VITE_WP_USERNAME;
    const appPassword = import.meta.env.VITE_WP_APP_PASSWORD;

    // Check if all required variables are present
    if (!url || !username || !appPassword) {
      this.isEnabledFlag = false;
      this.config = null;
      return;
    }

    // Validate HTTPS requirement
    if (!url.startsWith('https://')) {
      console.error(
        'WordPress URL must use HTTPS. HTTP URLs are not supported for security reasons.'
      );
      throw new Error('WordPress URL must use HTTPS');
    }

    // Remove trailing slash from URL
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    this.config = {
      url: cleanUrl,
      username,
      appPassword,
    };
    this.isEnabledFlag = true;
  }

  /**
   * Check if WordPress integration is enabled
   */
  isEnabled(): boolean {
    return this.isEnabledFlag;
  }

  /**
   * Get configuration object
   * Returns null if integration is disabled
   */
  getConfig(): WordPressConfigType | null {
    return this.config;
  }

  /**
   * Get WordPress URL
   */
  getUrl(): string | null {
    return this.config?.url || null;
  }

  /**
   * Get WordPress username
   */
  getUsername(): string | null {
    return this.config?.username || null;
  }

  /**
   * Get WordPress application password
   */
  getAppPassword(): string | null {
    return this.config?.appPassword || null;
  }
}
