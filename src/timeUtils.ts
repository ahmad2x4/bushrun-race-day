/**
 * Timezone utilities for converting to AEST (Australian Eastern Standard Time)
 * Sydney timezone: UTC+10 (winter) or UTC+11 (summer/daylight saving)
 */

/**
 * Get the current month in AEST (Sydney time)
 * @returns Month number 1-12 in AEST timezone
 */
export function getCurrentMonthAEST(): number {
  const sydneyDate = new Date(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }));
  return sydneyDate.getMonth() + 1;
}

/**
 * Get the month from a date in AEST (Sydney time)
 * @param date ISO date string (e.g., "2026-02-01" or "2026-01-31")
 * @returns Month number 1-12 in AEST timezone
 */
export function getMonthAEST(dateString: string): number {
  // Parse the ISO date string and convert to AEST
  const date = new Date(dateString);
  const sydneyDate = new Date(date.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }));
  return sydneyDate.getMonth() + 1;
}

/**
 * Get the year from a date in AEST (Sydney time)
 * @param dateString ISO date string (e.g., "2026-02-01")
 * @returns Year in AEST timezone
 */
export function getYearAEST(dateString: string): number {
  const date = new Date(dateString);
  const sydneyDate = new Date(date.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }));
  return sydneyDate.getFullYear();
}

/**
 * Get current date in AEST as ISO string (YYYY-MM-DD)
 * @returns ISO date string in AEST timezone
 */
export function getCurrentDateAEST(): string {
  const sydneyDate = new Date(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }));
  const year = sydneyDate.getFullYear();
  const month = String(sydneyDate.getMonth() + 1).padStart(2, '0');
  const day = String(sydneyDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
