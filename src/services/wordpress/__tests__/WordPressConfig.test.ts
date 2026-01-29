/**
 * WordPressConfig Unit Tests
 * Tests for WordPress configuration management and validation
 * Note: Due to Vite's compile-time environment injection, these tests verify
 * the configuration loading logic with the actual runtime environment values.
 */

import { describe, it, expect } from 'vitest';
import { WordPressConfig } from '../WordPressConfig';

describe('WordPressConfig', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = WordPressConfig.getInstance();
      const instance2 = WordPressConfig.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return a WordPressConfig instance', () => {
      const config = WordPressConfig.getInstance();
      expect(config).toBeInstanceOf(WordPressConfig);
    });
  });

  describe('Configuration Methods', () => {
    let config: WordPressConfig;

    beforeEach(() => {
      config = WordPressConfig.getInstance();
    });

    it('should have isEnabled method', () => {
      expect(typeof config.isEnabled).toBe('function');
      expect(typeof config.isEnabled()).toBe('boolean');
    });

    it('should have getConfig method', () => {
      expect(typeof config.getConfig).toBe('function');
      const result = config.getConfig();
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should have getUrl method', () => {
      expect(typeof config.getUrl).toBe('function');
      const result = config.getUrl();
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should have getUsername method', () => {
      expect(typeof config.getUsername).toBe('function');
      const result = config.getUsername();
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should have getAppPassword method', () => {
      expect(typeof config.getAppPassword).toBe('function');
      const result = config.getAppPassword();
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('Configuration State Consistency', () => {
    it('when enabled, all getter methods should return non-null values', () => {
      const config = WordPressConfig.getInstance();

      if (config.isEnabled()) {
        expect(config.getUrl()).not.toBeNull();
        expect(config.getUsername()).not.toBeNull();
        expect(config.getAppPassword()).not.toBeNull();
      }
    });

    it('config object should contain all required fields when enabled', () => {
      const config = WordPressConfig.getInstance();
      const configObj = config.getConfig();

      if (configObj !== null) {
        expect('url' in configObj).toBe(true);
        expect('username' in configObj).toBe(true);
        expect('appPassword' in configObj).toBe(true);
      }
    });

    it('when disabled, getConfig should return null', () => {
      const config = WordPressConfig.getInstance();

      if (!config.isEnabled()) {
        expect(config.getConfig()).toBeNull();
      }
    });

    it('URL should be a valid string when enabled', () => {
      const config = WordPressConfig.getInstance();
      const url = config.getUrl();

      if (url !== null) {
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
      }
    });

    it('username should be a valid string when enabled', () => {
      const config = WordPressConfig.getInstance();
      const username = config.getUsername();

      if (username !== null) {
        expect(typeof username).toBe('string');
        expect(username.length).toBeGreaterThan(0);
      }
    });

    it('appPassword should be a valid string when enabled', () => {
      const config = WordPressConfig.getInstance();
      const password = config.getAppPassword();

      if (password !== null) {
        expect(typeof password).toBe('string');
        expect(password.length).toBeGreaterThan(0);
      }
    });
  });

  describe('URL Handling', () => {
    it('URL should not have trailing slash when enabled', () => {
      const config = WordPressConfig.getInstance();
      const url = config.getUrl();

      if (url !== null) {
        expect(url).not.toMatch(/\/$/);
      }
    });

    it('URL should use HTTPS protocol when enabled', () => {
      const config = WordPressConfig.getInstance();
      const url = config.getUrl();

      if (url !== null) {
        expect(url).toMatch(/^https:\/\//);
      }
    });
  });

  describe('Integration with Real Environment', () => {
    it('should gracefully handle whatever environment is configured', () => {
      const config = WordPressConfig.getInstance();

      // Just verify it doesn't throw and returns expected types
      expect(() => {
        config.isEnabled();
        config.getConfig();
        config.getUrl();
        config.getUsername();
        config.getAppPassword();
      }).not.toThrow();
    });

    it('should provide consistent results across calls', () => {
      const config = WordPressConfig.getInstance();

      const url1 = config.getUrl();
      const url2 = config.getUrl();
      expect(url1).toEqual(url2);

      const username1 = config.getUsername();
      const username2 = config.getUsername();
      expect(username1).toEqual(username2);

      const password1 = config.getAppPassword();
      const password2 = config.getAppPassword();
      expect(password1).toEqual(password2);

      const enabled1 = config.isEnabled();
      const enabled2 = config.isEnabled();
      expect(enabled1).toBe(enabled2);
    });
  });
});
