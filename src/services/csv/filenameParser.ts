/**
 * CSV Filename Parser
 * Extracts metadata from CSV filenames for fallback matching
 */

import type { ParsedCSVFilename } from '../wordpress/types';

/**
 * Parse Bushrun CSV filename to extract year, month, and rollover status
 * Expects format: bushrun-next-race-YYYY-MM.csv or bushrun-next-race-YYYY-MM-rollover.csv
 * Also matches WordPress title field without .csv extension: bushrun-next-race-YYYY-MM
 */
export function parseCSVFilename(filename: string): ParsedCSVFilename | null {
  const regex = /bushrun-next-race-(\d{4})-(\d{2})(?:-rollover)?(?:\.csv)?/i;
  const match = filename.match(regex);

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const isSeasonRollover = filename.includes('-rollover');

  // Validate month (1-12)
  if (month < 1 || month > 12) {
    return null;
  }

  return {
    year,
    month,
    isSeasonRollover,
    filename,
  };
}

/**
 * Check if filename is a valid Bushrun CSV filename
 */
export function isValidCSVFilename(filename: string): boolean {
  return parseCSVFilename(filename) !== null;
}
