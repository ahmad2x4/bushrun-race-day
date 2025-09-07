import type { Runner, RaceResults, ValidationError } from './types';

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

// BBR handicap adjustments must be in 15-second increments (0:00, 0:15, 0:30, 0:45, 1:00, etc.)
export function roundToNext15Seconds(ms: number): number {
  if (ms <= 0) return 0;
  
  const totalSeconds = Math.ceil(ms / 1000);
  const remainder = totalSeconds % 15;
  
  if (remainder === 0) {
    return totalSeconds * 1000;
  }
  
  // Round up to next 15-second increment
  return (totalSeconds + (15 - remainder)) * 1000;
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
export function calculateHandicaps(runners: Runner[]): Runner[] {
  const results = [...runners]; // Create copy to avoid mutation
  const distances = ['5km', '10km'] as const;
  
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
        // 10km handicap rules per official rules - all adjustments rounded to 15-second increments
        if (position === 1) {
          const minimumAdjustment = 60000; // 1 minute minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext15Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position === 2) {
          const minimumAdjustment = 30000; // 30 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext15Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position === 3) {
          const minimumAdjustment = 15000; // 15 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext15Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position <= 9) {
          handicapAdjustmentMs = 0; // No change for 4th-9th place
        } else {
          handicapAdjustmentMs = -30000; // All other finishers: decrease by 30 seconds (already 15s increment)
        }
      } else {
        // 5km handicap rules per official rules - all adjustments rounded to 15-second increments
        if (position === 1) {
          const minimumAdjustment = 30000; // 30 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext15Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position === 2 || position === 3) {
          const minimumAdjustment = 15000; // 15 seconds minimum
          const timeBasedAdjustment = -timeDifferenceMs; // How much they beat target by
          handicapAdjustmentMs = roundToNext15Seconds(Math.max(minimumAdjustment, timeBasedAdjustment));
        } else if (position <= 9) {
          handicapAdjustmentMs = 0; // No change for 4th-9th place
        } else {
          handicapAdjustmentMs = -15000; // All other finishers: decrease by 15 seconds (already 15s increment)
        }
      }
      
      const newHandicapMs = Math.max(0, currentHandicapMs + handicapAdjustmentMs);
      runner.new_handicap = msToTimeString(newHandicapMs);
      runner.finish_position = position;
    });
  });
  
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
      
      const runner: Runner = {
        member_number: memberNumber,
        full_name: values[headers.indexOf('full_name')] || `Runner ${memberNumber}`,
        is_financial_member: isFinancialMember,
        distance: distance as '5km' | '10km',
        checked_in: false,
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
    'current_handicap_10k'
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
        runner.new_handicap : (runner.current_handicap_10k || '')
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
    'new_handicap'
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
    
    const row = [
      runner.member_number.toString(),
      `"${runner.full_name}"`,
      runner.distance,
      status,
      runner.finish_position?.toString() || '',
      finishTimeStr,
      runner[handicapKey] || '',
      runner.new_handicap || ''
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