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
 * @param dateString ISO date string (e.g., "2026-02-01" or "2026-01-31")
 * @returns Month number 1-12 in AEST timezone
 * @throws Error if dateString is invalid and cannot be parsed
 */
export function getMonthAEST(dateString: string | undefined): number {
  // Validate input - check for undefined, null, or empty string
  if (!dateString || dateString.trim() === '') {
    const fallbackMonth = getCurrentMonthAEST();
    console.error('[timeUtils] Invalid date string (empty or undefined). Using current month as fallback:', fallbackMonth);
    return fallbackMonth;
  }

  // Parse the ISO date string
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    const fallbackMonth = getCurrentMonthAEST();
    console.error(`[timeUtils] Invalid date string: "${dateString}". Using current month as fallback:`, fallbackMonth);
    return fallbackMonth;
  }

  // Convert to AEST
  const sydneyDate = new Date(date.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }));
  const month = sydneyDate.getMonth() + 1;

  // Final validation - ensure month is in valid range
  if (isNaN(month) || month < 1 || month > 12) {
    const fallbackMonth = getCurrentMonthAEST();
    console.error(`[timeUtils] Invalid month calculated: ${month} from date: "${dateString}". Using current month as fallback:`, fallbackMonth);
    return fallbackMonth;
  }

  return month;
}

/**
 * Get the year from a date in AEST (Sydney time)
 * @param dateString ISO date string (e.g., "2026-02-01")
 * @returns Year in AEST timezone
 * @throws Error if dateString is invalid and cannot be parsed
 */
export function getYearAEST(dateString: string | undefined): number {
  // Validate input
  if (!dateString || dateString.trim() === '') {
    const fallbackYear = new Date(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })).getFullYear();
    console.error('[timeUtils] Invalid date string (empty or undefined). Using current year as fallback:', fallbackYear);
    return fallbackYear;
  }

  // Parse the ISO date string
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    const fallbackYear = new Date(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })).getFullYear();
    console.error(`[timeUtils] Invalid date string: "${dateString}". Using current year as fallback:`, fallbackYear);
    return fallbackYear;
  }

  // Convert to AEST
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
