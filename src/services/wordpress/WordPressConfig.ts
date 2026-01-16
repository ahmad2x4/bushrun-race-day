/**
 * WordPress Configuration Service
 * Manages loading and validating WordPress credentials from environment variables or obfuscated values
 *
 * Dual-mode operation:
 * - Development: Uses import.meta.env (fast, readable)
 * - Production: Uses obfuscated credentials (secure, not searchable)
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
   * Load and validate configuration
   * Uses environment variables in development, obfuscated values in production
   */
  private loadAndValidateConfig(): void {
    try {
      // In development, use environment variables directly
      if (import.meta.env.DEV) {
        this.loadFromEnv();
        return;
      }

      // In production, try to load from obfuscated credentials
      try {
        this.loadFromObfuscated();
      } catch (error) {
        console.warn(
          '[WordPress Config] Failed to load obfuscated credentials, falling back to environment variables',
          error
        );
        // Fallback to environment variables if obfuscation fails
        this.loadFromEnv();
      }
    } catch (error) {
      console.error('[WordPress Config] Failed to load configuration:', error);
      this.isEnabledFlag = false;
      this.config = null;
    }
  }

  /**
   * Load credentials from environment variables
   * Used in development and as fallback in production
   */
  private loadFromEnv(): void {
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
   * Load credentials from obfuscated values (production builds)
   * Deobfuscates the credentials that were obfuscated at build time
   */
  private loadFromObfuscated(): void {
    // Dynamically import deobfuscator to keep it out of dev builds
    const { getObfuscatedCredentials } = require('./obfuscation/deobfuscator');

    try {
      const credentials = getObfuscatedCredentials();

      // Validate HTTPS requirement
      if (!credentials.url.startsWith('https://')) {
        console.error(
          'WordPress URL must use HTTPS. HTTP URLs are not supported for security reasons.'
        );
        throw new Error('WordPress URL must use HTTPS');
      }

      // Remove trailing slash from URL
      const cleanUrl = credentials.url.endsWith('/')
        ? credentials.url.slice(0, -1)
        : credentials.url;

      this.config = {
        url: cleanUrl,
        username: credentials.username,
        appPassword: credentials.appPassword,
      };
      this.isEnabledFlag = true;

      console.log('[WordPress Config] Loaded obfuscated credentials successfully');
    } catch (error) {
      console.error('[WordPress Config] Failed to load obfuscated credentials:', error);
      throw error;
    }
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
