/**
 * WordPress Service Layer - Type Definitions
 * Interfaces for WordPress API integration
 */

/**
 * WordPress configuration from environment variables
 */
export interface WordPressConfigType {
  url: string;
  username: string;
  appPassword: string;
}

/**
 * WordPress Media Library item (API response)
 */
export interface MediaItem {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  source_url: string;
  mime_type: string;
  media_details?: {
    file: string;
    filesize: number;
  };
  meta?: {
    race_name?: string;
    race_date?: string;
    race_month?: number;
    race_year?: number;
    csv_type?: string;
    is_season_rollover?: boolean;
  };
}

/**
 * Metadata attached to uploaded CSVs
 */
export interface CSVMetadata {
  race_name: string;
  race_date: string;
  race_month: number;
  race_year: number;
  csv_type: string;
  is_season_rollover: boolean;
}

/**
 * Generic service response wrapper
 * All service methods return this type for consistent error handling
 */
export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Response from pull operations
 */
export interface PullCSVResponse {
  runners: import('../../types').Runner[];
  metadata: CSVMetadata;
}

/**
 * Parsed filename information (from filename-based matching)
 */
export interface ParsedCSVFilename {
  year: number;
  month: number;
  isSeasonRollover: boolean;
  filename: string;
}
