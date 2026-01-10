/**
 * WordPress Authentication Service
 * Creates Basic Authentication headers for WordPress REST API
 */

import { WordPressConfig } from './WordPressConfig';

export class WordPressAuthService {
  /**
   * Create Basic Authentication header
   * Encodes username:password in base64 format
   */
  static createAuthHeader(): { Authorization: string } {
    const config = WordPressConfig.getInstance();

    const username = config.getUsername();
    const appPassword = config.getAppPassword();

    if (!username || !appPassword) {
      throw new Error('WordPress credentials not configured');
    }

    // Create "username:password" string
    const credentials = `${username}:${appPassword}`;

    // Encode to base64
    const encodedCredentials = btoa(credentials);

    return {
      Authorization: `Basic ${encodedCredentials}`,
    };
  }

  /**
   * Verify that credentials are available
   */
  static hasCredentials(): boolean {
    const config = WordPressConfig.getInstance();
    return config.isEnabled();
  }
}
