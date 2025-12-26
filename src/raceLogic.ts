import type { Runner, RaceResults, ValidationError, RunnerStatus, RaceHistoryEntry } from './types';

// Time conversion utilities
export function timeStringToMs(timeStr: string): number {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error(`Invalid time format: ${timeStr}. Expected MM:SS format.`);
  }
  
  const [minutes, seconds] = timeStr.split(':').map(Number);
  
  if (minutes < 0 || seconds < 0 || seconds >= 60) {
    throw new Error(`Invalid time values: ${timeStr}. Minutes must be >= 0, seconds must be 0-59.`);
  }
  
  return (minutes * 60 + seconds) * 1000; // Convert to milliseconds
}

export function msToTimeString(ms: number): string {
  if (ms < 0) {
    throw new Error(`Negative time not allowed: ${ms}`);
  }
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// BBR handicap adjustments must be in 5-second increments (0:00, 0:05, 0:10, 0:15, 0:20, etc.)
export function roundToNext5Seconds(ms: number): number {
  if (ms <= 0) return 0;

  const totalSeconds = Math.ceil(ms / 1000);
  const remainder = totalSeconds % 5;

  if (remainder === 0) {
    return totalSeconds * 1000;
  }

  // Round up to next 5-second increment
  return (totalSeconds + (5 - remainder)) * 1000;
}

// Cross-distance handicap calculations must be rounded to 15-second increments
export function roundToNearest15Seconds(ms: number): number {
  if (ms <= 0) return 0;

  const totalSeconds = Math.round(ms / 1000);
  const remainder = totalSeconds % 15;

  if (remainder === 0) {
    return totalSeconds * 1000;
  }

  // Round to nearest 15-second increment
  if (remainder < 7.5) {
    return (totalSeconds - remainder) * 1000;
  } else {
    return (totalSeconds + (15 - remainder)) * 1000;
  }
}

// Convert 10k handicap to 5k using formula: 5/6*1/24-(1/24-handicap_value)/2.1
export function convert10kTo5k(handicap10k: string): string {
  if (!handicap10k) {
    return '00:00';
  }

  try {
    // Convert handicap to fraction of day (Excel format where 1/24 = 1 hour)
    const handicapMs = timeStringToMs(handicap10k);
    const handicapFraction = handicapMs / (24 * 60 * 60 * 1000); // Convert to fraction of day

    // Apply formula: 5/6*1/24-(1/24-handicap_value)/2.1
    const oneHour = 1/24; // 1 hour as fraction of day
    const result = (5/6) * oneHour - (oneHour - handicapFraction) / 2.1;

    // Convert back to milliseconds
    const resultMs = result * (24 * 60 * 60 * 1000);

    // Round to nearest 15 seconds
    const roundedMs = roundToNearest15Seconds(Math.max(0, resultMs));

    return msToTimeString(roundedMs);
  } catch (error) {
    console.error('Error converting 10k to 5k handicap:', error);
    return '00:00';
  }
}

// Convert 5k handicap to 10k using formula: 1/24-(5/6*1/24-handicap_value)*2.1
export function convert5kTo10k(handicap5k: string): string {
  if (!handicap5k) {
    return '00:00';
  }

  try {
    // Convert handicap to fraction of day (Excel format where 1/24 = 1 hour)
    const handicapMs = timeStringToMs(handicap5k);
    const handicapFraction = handicapMs / (24 * 60 * 60 * 1000); // Convert to fraction of day

    // Apply formula: 1/24-(5/6*1/24-handicap_value)*2.1
    const oneHour = 1/24; // 1 hour as fraction of day
    const result = oneHour - ((5/6) * oneHour - handicapFraction) * 2.1;

    // Convert back to milliseconds
    const resultMs = result * (24 * 60 * 60 * 1000);

    // Round to nearest 15 seconds
    const roundedMs = roundToNearest15Seconds(Math.max(0, resultMs));

    return msToTimeString(roundedMs);
  } catch (error) {
    console.error('Error converting 5k to 10k handicap:', error);
    return '00:00';
  }
}

// Get handicap for any distance (official or calculated)
export function getHandicapForDistance(runner: Runner, distance: '5km' | '10km'): {
  handicap: string,
  isCalculated: boolean
} {
  // First try to get official handicap for the requested distance
  const officialHandicap = distance === '5km' ? runner.current_handicap_5k : runner.current_handicap_10k;

  if (officialHandicap && officialHandicap !== '0:00') {
    return {
      handicap: officialHandicap,
      isCalculated: false
    };
  }

  // If no official handicap, try to calculate from other distance
  const otherDistance = distance === '5km' ? '10km' : '5km';
  const otherHandicap = otherDistance === '5km' ? runner.current_handicap_5k : runner.current_handicap_10k;

  if (otherHandicap && otherHandicap !== '0:00') {
    const calculatedHandicap = distance === '5km'
      ? convert10kTo5k(otherHandicap)
      : convert5kTo10k(otherHandicap);

    return {
      handicap: calculatedHandicap,
      isCalculated: true
    };
  }

  // No handicap available for either distance
  return {
    handicap: '00:00',
    isCalculated: false
  };
}

export function formatFinishTime(ms: number): string {
  if (ms < 0) {
    throw new Error(`Negative time not allowed: ${ms}`);
  }
  
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
}

// Handicap calculation engine - follows BBR handicap adjustment rules:
// - Target finish times: 5km = 50 minutes, 10km = 60 minutes (from race start)
// - "Beating handicap" means finishing before the target time for their distance
// - Handicaps increase for podium finishers (1st, 2nd, 3rd)
// - Adjustment is the greater of minimum time OR amount by which they beat the target
// - DNF and Early Start runners keep their handicap unchanged
// - Starters/Timekeepers get -30s (10km only, N/A for 5km)
// - 4th-9th place: no change
// - 10th+ place: penalty reduction (-30s for 10km, -15s for 5km)
// - Also updates championship points if raceMonth is provided
export function calculateHandicaps(runners: Runner[], raceMonth?: number): Runner[] {
  const results = [...runners]; // Create copy to avoid mutation
  const distances = ['5km', '10km'] as const;

  // Debug logging for championship system
  if (raceMonth !== undefined) {
    console.log(`[Championship] Calculating handicaps for month ${raceMonth}`);
    const runnersWithFinish = runners.filter(r => r.finish_time !== undefined);
    console.log(`[Championship] Runners with finish times: ${runnersWithFinish.length} of ${runners.length}`);
    if (runnersWithFinish.length === 0) {
      console.warn('[Championship] ⚠️  No runners have finish_time! Championship data will be empty.');
    }
  }
  
  // BBR target finish times from race start (everyone should finish at these times)
  const TARGET_5KM_MS = 50 * 60 * 1000; // 50 minutes = 8:05am
  const TARGET_10KM_MS = 60 * 60 * 1000; // 60 minutes = 8:15am
  
  // First, handle DNF, Early Start, and Starter/Timekeeper runners
  results.forEach(runner => {
    if (runner.status === 'dnf' || runner.status === 'early_start') {
      const handicapKey = runner.distance === '5km' ? 'current_handicap_5k' : 'current_handicap_10k';
      const currentHandicap = runner[handicapKey];
      if (currentHandicap) {
        runner.new_handicap = currentHandicap; // Keep handicap unchanged
      }
    } else if (runner.status === 'starter_timekeeper') {
      const handicapKey = runner.distance === '5km' ? 'current_handicap_5k' : 'current_handicap_10k';
      const currentHandicap = runner[handicapKey];
      if (currentHandicap) {
        if (runner.distance === '10km') {
          // Starters/Timekeepers get -30 seconds for 10km only
          const currentHandicapMs = timeStringToMs(currentHandicap);
          const newHandicapMs = Math.max(0, currentHandicapMs - 30000);
          runner.new_handicap = msToTimeString(newHandicapMs);
        } else {
          // No change for 5km starters/timekeepers (N/A in rules)
          runner.new_handicap = currentHandicap;
        }
      }
    }
  });
  
  distances.forEach(distance => {
    const distanceRunners = results
      .filter(r => r.distance === distance && r.finish_time !== undefined && (!r.status || r.status === 'finished'))
      .sort((a, b) => a.finish_time! - b.finish_time!);
    
    distanceRunners.forEach((runner, index) => {
      const position = index + 1;
      const handicapKey = distance === '5km' ? 'current_handicap_5k' : 'current_handicap_10k';
      const currentHandicap = runner[handicapKey];
      
      if (!currentHandicap) {
        // Skip calculation if no handicap for this distance
        return;
      }
      
      const currentHandicapMs = timeStringToMs(currentHandicap);
      
      // Calculate how much they beat/missed the target finish time for their distance
      const targetFinishTimeMs = distance === '5km' ? TARGET_5KM_MS : TARGET_10KM_MS;
      const timeDifferenceMs = runner.finish_time! - targetFinishTimeMs; 
      // Negative = beat target (finished early), Positive = slower than target (finished late)
      
      let handicapAdjustmentMs = 0;
      
      if (distance === '10km') {
        // 10km handicap rules per official rules - all adjustments rounded to 5-second increments
        if (position === 1) {
          const minimumAdjustment = 60000; // 1 minute minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext5Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position === 2) {
          const minimumAdjustment = 30000; // 30 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext5Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position === 3) {
          const minimumAdjustment = 15000; // 15 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext5Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position <= 9) {
          handicapAdjustmentMs = 0; // No change for 4th-9th place
        } else {
          handicapAdjustmentMs = -30000; // All other finishers: decrease by 30 seconds (already 5s increment)
        }
      } else {
        // 5km handicap rules per official rules - all adjustments rounded to 5-second increments
        if (position === 1) {
          const minimumAdjustment = 30000; // 30 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext5Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position === 2 || position === 3) {
          const minimumAdjustment = 15000; // 15 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext5Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position <= 9) {
          handicapAdjustmentMs = 0; // No change for 4th-9th place
        } else {
          handicapAdjustmentMs = -15000; // All other finishers: decrease by 15 seconds (already 5s increment)
        }
      }
      
      const newHandicapMs = Math.max(0, currentHandicapMs + handicapAdjustmentMs);
      runner.new_handicap = msToTimeString(newHandicapMs);
      runner.finish_position = position;
    });
  });

  // Update championship data if raceMonth is provided
  if (raceMonth !== undefined) {
    const updatedResults = results.map(runner => updateChampionshipData(runner, raceMonth));

    // Debug: Check if championship data was set
    const runnersWithChampionship = updatedResults.filter(r =>
      (r.distance === '5km' && (r.championship_points_5k || r.championship_races_5k)) ||
      (r.distance === '10km' && (r.championship_points_10k || r.championship_races_10k))
    );
    console.log(`[Championship] After updateChampionshipData: ${runnersWithChampionship.length} runners have championship data`);
    if (runnersWithChampionship.length > 0) {
      console.log(`[Championship] ✅ Sample runner:`, runnersWithChampionship[0].full_name,
        `points_5k=${runnersWithChampionship[0].championship_points_5k}, ` +
        `points_10k=${runnersWithChampionship[0].championship_points_10k}`);
    }

    return updatedResults;
  }

  return results;
}

// Results generation
export function generateResults(runners: Runner[]): { fiveKm: RaceResults; tenKm: RaceResults } {
  const fiveKmRunners = runners
    .filter(r => r.distance === '5km' && r.finish_time !== undefined)
    .sort((a, b) => a.finish_time! - b.finish_time!);
  
  const tenKmRunners = runners
    .filter(r => r.distance === '10km' && r.finish_time !== undefined)
    .sort((a, b) => a.finish_time! - b.finish_time!);
  
  return {
    fiveKm: {
      distance: '5km',
      podium: {
        first: fiveKmRunners[0],
        second: fiveKmRunners[1],
        third: fiveKmRunners[2],
      },
      all_finishers: fiveKmRunners,
    },
    tenKm: {
      distance: '10km',
      podium: {
        first: tenKmRunners[0],
        second: tenKmRunners[1],
        third: tenKmRunners[2],
      },
      all_finishers: tenKmRunners,
    },
  };
}

// ============================================================================
// Championship System Functions
// ============================================================================

/**
 * Calculate championship points based on finish position and status
 * @param position Finish position (1st, 2nd, etc.) or null if no position
 * @param status Runner status (finished, dnf, early_start, starter_timekeeper)
 * @returns Points earned (0-20)
 */
export function getChampionshipPoints(position: number | null, status?: RunnerStatus): number {
  // Handle special cases first
  if (status === 'starter_timekeeper') return 4;
  if (status === 'early_start' || status === 'dnf') return 1;
  if (position === null || position === undefined) return 0;

  // Position-based points
  const pointsTable = [20, 15, 11, 8, 6, 5, 4, 3, 2, 1];
  if (position >= 1 && position <= 10) {
    return pointsTable[position - 1];
  }
  // 10th place and beyond: 1 point
  return 1;
}

/**
 * Parse race history string into structured array
 * Format: "MONTH:POSITION:POINTS:TIME|MONTH:POSITION:POINTS:TIME|..."
 * Example: "2:1:20:895|3:2:15:920|4:3:11:940"
 */
export function parseChampionshipRaceHistory(history: string): RaceHistoryEntry[] {
  if (!history || history.trim() === '') {
    return [];
  }

  const entries: RaceHistoryEntry[] = [];
  const parts = history.split('|').filter(p => p.trim());

  for (const part of parts) {
    const fields = part.split(':');
    if (fields.length !== 4) {
      throw new Error(`Invalid race history format: "${part}". Expected "MONTH:POSITION:POINTS:TIME"`);
    }

    const [monthStr, positionStr, pointsStr, timeStr] = fields;
    const month = parseInt(monthStr, 10);
    const points = parseInt(pointsStr, 10);
    const time = parseInt(timeStr, 10);

    // Validation
    if (isNaN(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}. Expected 1-12`);
    }
    if (isNaN(points) || points < 0 || points > 20) {
      throw new Error(`Invalid points: ${points}. Expected 0-20`);
    }
    if (isNaN(time) || time < 0) {
      throw new Error(`Invalid time: ${time}. Expected non-negative number`);
    }

    entries.push({
      month,
      position: positionStr,
      points,
      time
    });
  }

  return entries;
}

/**
 * Format race history array back to string
 */
export function formatChampionshipRaceHistory(entries: RaceHistoryEntry[]): string {
  return entries.map(e => `${e.month}:${e.position}:${e.points}:${e.time}`).join('|');
}

/**
 * Calculate total points from best 8 races
 */
export function calculateBest8Total(history: string): number {
  if (!history || history.trim() === '') {
    return 0;
  }

  try {
    const entries = parseChampionshipRaceHistory(history);
    if (entries.length === 0) return 0;

    // Sort by points descending and take top 8
    const sorted = [...entries].sort((a, b) => b.points - a.points);
    const best8 = sorted.slice(0, 8);

    return best8.reduce((sum, entry) => sum + entry.points, 0);
  } catch (error) {
    console.error('Error calculating best 8 total:', error);
    return 0;
  }
}

/**
 * Append a new race result to race history
 * Updates existing month if it already exists, appends if new
 */
export function appendRaceToHistory(
  existingHistory: string,
  month: number,
  position: string | number,
  points: number,
  time: number
): string {
  // Validate month is valid (1-12)
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Expected 1-12`);
  }
  if (points < 0 || points > 20) {
    throw new Error(`Invalid points: ${points}. Expected 0-20`);
  }
  if (time < 0) {
    throw new Error(`Invalid time: ${time}. Expected non-negative number`);
  }

  const entries = parseChampionshipRaceHistory(existingHistory);
  const positionStr = String(position);

  // Check if this month already exists and update it
  const existingIndex = entries.findIndex(e => e.month === month);
  const newEntry: RaceHistoryEntry = { month, position: positionStr, points, time };

  if (existingIndex >= 0) {
    entries[existingIndex] = newEntry;
  } else {
    entries.push(newEntry);
  }

  // Sort by month before formatting
  entries.sort((a, b) => a.month - b.month);
  return formatChampionshipRaceHistory(entries);
}

/**
 * Update runner's championship data after race completion
 * Called after race results are finalized
 */
export function updateChampionshipData(runner: Runner, currentMonth: number): Runner {
  // Only update if runner is official for their distance
  const isOfficial = runner.distance === '5km' ? runner.is_official_5k : runner.is_official_10k;
  if (!isOfficial) {
    console.debug(`[Championship] ${runner.full_name} (${runner.distance}) - Not official, skipping`);
    return runner;
  }

  // Only update if runner actually participated (finished, DNF, early start, or starter/timekeeper)
  if (!runner.finish_position && !runner.status) {
    console.debug(`[Championship] ${runner.full_name} (${runner.distance}) - Did not participate, skipping`);
    return runner;
  }

  // Get championship points for this race
  const pointsEarned = getChampionshipPoints(runner.finish_position ?? null, runner.status);

  // Debug: Log what's being calculated
  if (runner.finish_position !== undefined || runner.status) {
    const posStr = runner.status === 'dnf' ? 'DNF' : runner.status === 'early_start' ? 'ES' : runner.finish_position || '?';
    console.debug(`[Championship] ${runner.full_name} (${runner.distance}): Position ${posStr} = ${pointsEarned} pts`);
  }

  // Get finish time in seconds (convert from milliseconds)
  const timeInSeconds = runner.finish_time ? Math.round(runner.finish_time / 1000) : 0;

  // Determine position string
  let positionStr: string;
  if (runner.status === 'starter_timekeeper') {
    positionStr = 'ST';
  } else if (runner.status === 'dnf') {
    positionStr = 'DNF';
  } else if (runner.status === 'early_start') {
    positionStr = 'ES';
  } else {
    positionStr = String(runner.finish_position || 0);
  }

  // Update the appropriate distance history
  const updatedRunner = { ...runner };

  if (runner.distance === '5km') {
    const currentHistory = runner.championship_races_5k || '';
    updatedRunner.championship_races_5k = appendRaceToHistory(
      currentHistory,
      currentMonth,
      positionStr,
      pointsEarned,
      timeInSeconds
    );
    updatedRunner.championship_points_5k = calculateBest8Total(updatedRunner.championship_races_5k);
  } else {
    const currentHistory = runner.championship_races_10k || '';
    updatedRunner.championship_races_10k = appendRaceToHistory(
      currentHistory,
      currentMonth,
      positionStr,
      pointsEarned,
      timeInSeconds
    );
    updatedRunner.championship_points_10k = calculateBest8Total(updatedRunner.championship_races_10k);
  }

  return updatedRunner;
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(field => field.replace(/^"(.*)"$/, '$1')); // Remove surrounding quotes
}

// CSV parsing with validation
export function parseCSV(csvText: string): Runner[] {
  if (!csvText.trim()) {
    throw new Error('CSV file is empty');
  }
  
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['member_number', 'full_name', 'is_financial_member', 'distance'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
  }
  
  const runners: Runner[] = [];
  const memberNumbers = new Set<number>();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    
    try {
      // Parse member number as integer
      const memberNumberStr = values[headers.indexOf('member_number')];
      const memberNumber = parseInt(memberNumberStr);
      
      if (isNaN(memberNumber) || memberNumber <= 0) {
        throw new Error(`Invalid member number "${memberNumberStr}" at row ${i + 1}. Must be a positive integer.`);
      }
      
      // Check for duplicate member numbers
      if (memberNumbers.has(memberNumber)) {
        throw new Error(`Duplicate member number ${memberNumber} at row ${i + 1}`);
      }
      memberNumbers.add(memberNumber);
      
      // Parse distance
      const distance = values[headers.indexOf('distance')];
      if (!['5km', '10km'].includes(distance)) {
        throw new Error(`Invalid distance "${distance}" at row ${i + 1}. Must be "5km" or "10km"`);
      }
      
      // Parse financial member status
      const isFinancialStr = values[headers.indexOf('is_financial_member')].toLowerCase();
      const isFinancialMember = ['true', '1', 'yes'].includes(isFinancialStr);

      // Parse official status flags (default to true for backward compatibility)
      const isOfficial5kIndex = headers.indexOf('is_official_5k');
      const isOfficial10kIndex = headers.indexOf('is_official_10k');

      const isOfficial5k = isOfficial5kIndex !== -1 && values[isOfficial5kIndex]
        ? ['true', '1', 'yes'].includes(values[isOfficial5kIndex].toLowerCase())
        : true; // Default to true if field missing

      const isOfficial10k = isOfficial10kIndex !== -1 && values[isOfficial10kIndex]
        ? ['true', '1', 'yes'].includes(values[isOfficial10kIndex].toLowerCase())
        : true; // Default to true if field missing

      const runner: Runner = {
        member_number: memberNumber,
        full_name: values[headers.indexOf('full_name')] || `Runner ${memberNumber}`,
        is_financial_member: isFinancialMember,
        distance: distance as '5km' | '10km',
        checked_in: false,
        is_official_5k: isOfficial5k,
        is_official_10k: isOfficial10k,
      };
      
      // Add handicaps if present and validate format
      const handicap5kIndex = headers.indexOf('current_handicap_5k');
      const handicap10kIndex = headers.indexOf('current_handicap_10k');
      
      if (handicap5kIndex !== -1 && values[handicap5kIndex]) {
        const handicap5k = values[handicap5kIndex];
        if (!/^\d{2}:\d{2}$/.test(handicap5k)) {
          throw new Error(`Invalid 5K handicap format "${handicap5k}" at row ${i + 1}. Use MM:SS format (e.g., "02:15")`);
        }
        runner.current_handicap_5k = handicap5k;
      }
      
      if (handicap10kIndex !== -1 && values[handicap10kIndex]) {
        const handicap10k = values[handicap10kIndex];
        if (!/^\d{2}:\d{2}$/.test(handicap10k)) {
          throw new Error(`Invalid 10K handicap format "${handicap10k}" at row ${i + 1}. Use MM:SS format (e.g., "09:30")`);
        }
        runner.current_handicap_10k = handicap10k;
      }

      // Parse championship fields if present
      const championshipRaces5kIndex = headers.indexOf('championship_races_5k');
      const championshipRaces10kIndex = headers.indexOf('championship_races_10k');
      const championshipPoints5kIndex = headers.indexOf('championship_points_5k');
      const championshipPoints10kIndex = headers.indexOf('championship_points_10k');

      if (championshipRaces5kIndex !== -1 && values[championshipRaces5kIndex]) {
        runner.championship_races_5k = values[championshipRaces5kIndex];
      }

      if (championshipRaces10kIndex !== -1 && values[championshipRaces10kIndex]) {
        runner.championship_races_10k = values[championshipRaces10kIndex];
      }

      if (championshipPoints5kIndex !== -1 && values[championshipPoints5kIndex]) {
        const points = parseInt(values[championshipPoints5kIndex], 10);
        if (!isNaN(points) && points >= 0) {
          runner.championship_points_5k = points;
        }
      }

      if (championshipPoints10kIndex !== -1 && values[championshipPoints10kIndex]) {
        const points = parseInt(values[championshipPoints10kIndex], 10);
        if (!isNaN(points) && points >= 0) {
          runner.championship_points_10k = points;
        }
      }

      runners.push(runner);
    } catch (error) {
      throw new Error(`Error parsing row ${i + 1}: ${(error as Error).message}`);
    }
  }
  
  return runners;
}

// Additional validation for runner data consistency
export function validateRunnerData(runners: Runner[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  runners.forEach((runner, index) => {
    // Check that runner has handicap for their distance
    const handicapKey = runner.distance === '5km' ? 'current_handicap_5k' : 'current_handicap_10k';
    if (!runner[handicapKey]) {
      errors.push({
        field: `runner[${index}].${handicapKey}`,
        message: `${runner.full_name} (${runner.member_number}) is registered for ${runner.distance} but missing handicap time`
      });
    }
    
    // Validate name is not empty
    if (!runner.full_name.trim()) {
      errors.push({
        field: `runner[${index}].full_name`,
        message: `Runner ${runner.member_number} has empty name`
      });
    }
  });
  
  return errors;
}

// Export functionality
export function generateNextRaceCSV(runners: Runner[]): string {
  const headers = [
    'member_number',
    'full_name',
    'is_financial_member',
    'distance',
    'current_handicap_5k',
    'current_handicap_10k',
    'is_official_5k',
    'is_official_10k',
    'championship_races_5k',
    'championship_races_10k',
    'championship_points_5k',
    'championship_points_10k'
  ];

  const csvRows = [headers.join(',')];

  runners.forEach(runner => {
    const row = [
      runner.member_number.toString(),
      `"${runner.full_name}"`,
      runner.is_financial_member.toString(),
      runner.distance,
      runner.distance === '5km' && runner.new_handicap ?
        runner.new_handicap : (runner.current_handicap_5k || ''),
      runner.distance === '10km' && runner.new_handicap ?
        runner.new_handicap : (runner.current_handicap_10k || ''),
      (runner.is_official_5k ?? true).toString(),
      (runner.is_official_10k ?? true).toString(),
      `"${runner.championship_races_5k || ''}"`,
      `"${runner.championship_races_10k || ''}"`,
      (runner.championship_points_5k ?? 0).toString(),
      (runner.championship_points_10k ?? 0).toString()
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

export function generateResultsCSV(runners: Runner[]): string {
  const headers = [
    'member_number',
    'full_name',
    'distance',
    'status',
    'finish_position',
    'finish_time',
    'old_handicap',
    'new_handicap',
    'is_official_5k',
    'is_official_10k',
    'championship_points_earned',
    'championship_races_5k',
    'championship_races_10k',
    'championship_points_5k',
    'championship_points_10k'
  ];

  const csvRows = [headers.join(',')];

  // Include all processed runners (finished, DNF, Early Start, Starter/Timekeeper)
  const processedRunners = runners
    .filter(r => r.finish_time !== undefined || r.status === 'dnf' || r.status === 'early_start' || r.status === 'starter_timekeeper')
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        // Sort 5km before 10km
        return a.distance === '5km' ? -1 : 1;
      }
      // Finished runners first (by position), then DNF/Early Start
      if (a.finish_position && b.finish_position) {
        return a.finish_position - b.finish_position;
      }
      if (a.finish_position && !b.finish_position) return -1;
      if (!a.finish_position && b.finish_position) return 1;
      return a.member_number - b.member_number;
    });

  processedRunners.forEach(runner => {
    const handicapKey = runner.distance === '5km' ? 'current_handicap_5k' : 'current_handicap_10k';
    const status = runner.status || (runner.finish_time ? 'finished' : '');
    const finishTimeStr = runner.finish_time ? formatFinishTime(runner.finish_time) : '';

    // Calculate points earned in this race
    const pointsEarned = getChampionshipPoints(runner.finish_position ?? null, runner.status);

    const row = [
      runner.member_number.toString(),
      `"${runner.full_name}"`,
      runner.distance,
      status,
      runner.finish_position?.toString() || '',
      finishTimeStr,
      runner[handicapKey] || '',
      runner.new_handicap || '',
      (runner.is_official_5k ?? true).toString(),
      (runner.is_official_10k ?? true).toString(),
      pointsEarned.toString(),
      `"${runner.championship_races_5k || ''}"`,
      `"${runner.championship_races_10k || ''}"`,
      (runner.championship_points_5k ?? 0).toString(),
      (runner.championship_points_10k ?? 0).toString()
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Download helper for browser
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  }
}

// ============================================================================
// Championship Dashboard Helper Functions
// ============================================================================

/**
 * Identify which races count toward best 8 championship total
 * Returns set of month numbers that are in best 8
 * @param history Race history string in format "MONTH:POSITION:POINTS:TIME|..."
 * @returns Set of month numbers (1-12) that are in the best 8
 */
export function identifyBest8Races(history: string): Set<number> {
  const races = parseChampionshipRaceHistory(history);
  const sorted = [...races].sort((a, b) => b.points - a.points);
  const best8 = sorted.slice(0, 8);
  return new Set(best8.map(r => r.month));
}

/**
 * Format month number to month abbreviation
 * @param month Month number (1-12)
 * @returns Month abbreviation (e.g., "Jan", "Feb", "Dec")
 */
export function formatMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || 'Unknown';
}

/**
 * Count number of race wins (1st place finishes) in championship history
 * @param history Race history string "MONTH:POSITION:POINTS:TIME|..."
 * @returns Number of races where position is "1"
 */
export function countRaceWins(history: string): number {
  if (!history) return 0

  const races = parseChampionshipRaceHistory(history)
  const wins = races.filter(race => race.position === '1')
  return wins.length
}

/**
 * Count total race participations in championship history
 * @param history Race history string "MONTH:POSITION:POINTS:TIME|..."
 * @returns Total number of races participated in
 */
export function countTotalParticipations(history: string): number {
  if (!history) return 0

  const races = parseChampionshipRaceHistory(history)
  return races.length
}

/**
 * Compare two runners for championship standings with tie-breaking rules
 * Tie-breaking order:
 * 1. Championship points (descending)
 * 2. Most race wins (descending)
 * 3. Most participations (descending)
 *
 * @param a First runner
 * @param b Second runner
 * @param distance Distance to compare ('5km' or '10km')
 * @returns Negative if a ranks higher, positive if b ranks higher, 0 if tied
 */
export function compareRunnersWithTieBreaking(
  a: Runner,
  b: Runner,
  distance: '5km' | '10km'
): number {
  // Get championship points for this distance
  const aPoints = distance === '5km' ? (a.championship_points_5k || 0) : (a.championship_points_10k || 0)
  const bPoints = distance === '5km' ? (b.championship_points_5k || 0) : (b.championship_points_10k || 0)

  // Primary sort: Championship points (descending)
  if (bPoints !== aPoints) {
    return bPoints - aPoints
  }

  // Tie-breaker 1: Most race wins (descending)
  const aHistory = distance === '5km' ? (a.championship_races_5k || '') : (a.championship_races_10k || '')
  const bHistory = distance === '5km' ? (b.championship_races_5k || '') : (b.championship_races_10k || '')

  const aWins = countRaceWins(aHistory)
  const bWins = countRaceWins(bHistory)

  if (bWins !== aWins) {
    return bWins - aWins
  }

  // Tie-breaker 2: Most participations (descending)
  const aRaces = countTotalParticipations(aHistory)
  const bRaces = countTotalParticipations(bHistory)

  return bRaces - aRaces
}