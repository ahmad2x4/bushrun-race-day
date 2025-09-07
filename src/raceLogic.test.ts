import { describe, it, expect } from 'vitest';
import {
  timeStringToMs,
  msToTimeString,
  formatFinishTime,
  roundToNext15Seconds,
  calculateHandicaps,
  generateResults,
  parseCSV,
  validateRunnerData,
  generateNextRaceCSV,
  generateResultsCSV
} from './raceLogic';
import type { Runner } from './types';

describe('Time conversion utilities', () => {
  describe('timeStringToMs', () => {
    it('should convert MM:SS to milliseconds', () => {
      expect(timeStringToMs('02:15')).toBe(135000); // 2 min 15 sec = 135 seconds * 1000
      expect(timeStringToMs('00:30')).toBe(30000);
      expect(timeStringToMs('10:45')).toBe(645000);
    });

    it('should handle edge cases', () => {
      expect(timeStringToMs('00:00')).toBe(0);
      expect(timeStringToMs('00:59')).toBe(59000);
      expect(timeStringToMs('99:00')).toBe(5940000);
    });

    it('should throw error for invalid formats', () => {
      expect(() => timeStringToMs('2:15')).toThrow('Invalid time format');
      expect(() => timeStringToMs('02:5')).toThrow('Invalid time format');
      expect(() => timeStringToMs('ab:cd')).toThrow('Invalid time format');
      expect(() => timeStringToMs('')).toThrow('Invalid time format');
      expect(() => timeStringToMs('2:15:30')).toThrow('Invalid time format');
    });

    it('should throw error for invalid time values', () => {
      expect(() => timeStringToMs('02:60')).toThrow('Invalid time values');
      expect(() => timeStringToMs('-1:30')).toThrow('Invalid time format'); // This fails format check first
      expect(() => timeStringToMs('02:-5')).toThrow('Invalid time format'); // This fails format check first
    });
  });

  describe('msToTimeString', () => {
    it('should convert milliseconds to MM:SS format', () => {
      expect(msToTimeString(135000)).toBe('02:15');
      expect(msToTimeString(30000)).toBe('00:30');
      expect(msToTimeString(645000)).toBe('10:45');
    });

    it('should handle edge cases', () => {
      expect(msToTimeString(0)).toBe('00:00');
      expect(msToTimeString(59000)).toBe('00:59');
      expect(msToTimeString(3600000)).toBe('60:00'); // 1 hour
    });

    it('should throw error for negative values', () => {
      expect(() => msToTimeString(-1000)).toThrow('Negative time not allowed');
    });
  });

  describe('formatFinishTime', () => {
    it('should format finish times with decimal seconds', () => {
      expect(formatFinishTime(135500)).toBe('2:15.5');
      expect(formatFinishTime(30750)).toBe('0:30.8');
      expect(formatFinishTime(600000)).toBe('10:00.0');
    });

    it('should handle edge cases', () => {
      expect(formatFinishTime(0)).toBe('0:00.0');
      expect(formatFinishTime(999)).toBe('0:01.0');
    });

    it('should throw error for negative values', () => {
      expect(() => formatFinishTime(-1000)).toThrow('Negative time not allowed');
    });
  });

  describe('time conversion round-trip', () => {
    it('should be consistent both ways', () => {
      const timeStrings = ['02:15', '00:30', '10:45', '00:00', '59:59'];
      
      timeStrings.forEach(timeStr => {
        const ms = timeStringToMs(timeStr);
        const backToString = msToTimeString(ms);
        expect(backToString).toBe(timeStr);
      });
    });
  });

  describe('roundToNext15Seconds', () => {
    it('should round up to next 15-second increment', () => {
      // Values already at 15-second increments should stay the same
      expect(roundToNext15Seconds(0)).toBe(0);       // 0:00
      expect(roundToNext15Seconds(15000)).toBe(15000); // 0:15
      expect(roundToNext15Seconds(30000)).toBe(30000); // 0:30
      expect(roundToNext15Seconds(45000)).toBe(45000); // 0:45
      expect(roundToNext15Seconds(60000)).toBe(60000); // 1:00
      
      // Values that need rounding up
      expect(roundToNext15Seconds(1000)).toBe(15000);   // 0:01 -> 0:15
      expect(roundToNext15Seconds(7000)).toBe(15000);   // 0:07 -> 0:15
      expect(roundToNext15Seconds(14000)).toBe(15000);  // 0:14 -> 0:15
      expect(roundToNext15Seconds(16000)).toBe(30000);  // 0:16 -> 0:30
      expect(roundToNext15Seconds(37000)).toBe(45000);  // 0:37 -> 0:45
      expect(roundToNext15Seconds(52000)).toBe(60000);  // 0:52 -> 1:00
      expect(roundToNext15Seconds(73000)).toBe(75000);  // 1:13 -> 1:15
    });

    it('should handle zero and negative values', () => {
      expect(roundToNext15Seconds(0)).toBe(0);
      expect(roundToNext15Seconds(-1000)).toBe(0);
      expect(roundToNext15Seconds(-15000)).toBe(0);
    });

    it('should handle larger time values', () => {
      expect(roundToNext15Seconds(125000)).toBe(135000); // 2:05 -> 2:15
      expect(roundToNext15Seconds(300000)).toBe(300000); // 5:00 (already 15s increment)
      expect(roundToNext15Seconds(307000)).toBe(315000); // 5:07 -> 5:15
    });
  });
});

describe('Handicap calculation engine', () => {
  const createRunner = (memberNumber: number, distance: '5km' | '10km', handicap: string, finishTimeMs: number): Runner => ({
    member_number: memberNumber,
    full_name: `Runner ${memberNumber}`,
    is_financial_member: true,
    distance,
    current_handicap_5k: distance === '5km' ? handicap : undefined,
    current_handicap_10k: distance === '10km' ? handicap : undefined,
    checked_in: true,
    finish_time: finishTimeMs
  });

  describe('calculateHandicaps', () => {
    it('should calculate 10km handicaps correctly', () => {
      // Target finish time for 10km = 60 minutes (3,600,000ms)
      const runners: Runner[] = [
        createRunner(1, '10km', '08:00', timeStringToMs('58:00')), // 1st - finished at 58min, beat target by 2min, gets +2min
        createRunner(2, '10km', '09:00', timeStringToMs('59:45')), // 2nd - finished at 59:45, beat target by 15s, gets +30s (min)  
        createRunner(3, '10km', '10:00', timeStringToMs('59:50')), // 3rd - finished at 59:50, beat target by 10s, gets +15s (min)
        createRunner(4, '10km', '05:00', timeStringToMs('61:00')), // 4th - finished at 61min, slower than target, no change
        createRunner(5, '10km', '06:00', timeStringToMs('62:00'))  // 5th - finished at 62min, slower than target, no change (4th-9th)
      ];

      const results = calculateHandicaps(runners);
      
      expect(results[0].new_handicap).toBe('10:00'); // 08:00 + 2:00 (beat target by 2 min)
      expect(results[1].new_handicap).toBe('09:30'); // 09:00 + 0:30 (minimum for 2nd place)
      expect(results[2].new_handicap).toBe('10:15'); // 10:00 + 0:15 (minimum for 3rd place)
      expect(results[3].new_handicap).toBe('05:00'); // unchanged (4th place)
      expect(results[4].new_handicap).toBe('06:00'); // unchanged (5th place)
    });

    it('should calculate 5km handicaps correctly', () => {
      // Target finish time for 5km = 50 minutes (3,000,000ms)
      const runners: Runner[] = [
        createRunner(1, '5km', '04:00', timeStringToMs('49:00')), // 1st - finished at 49min, beat target by 1min, gets +1min
        createRunner(2, '5km', '05:00', timeStringToMs('49:50')), // 2nd - finished at 49:50, beat target by 10s, gets +15s (min)
        createRunner(3, '5km', '06:00', timeStringToMs('49:55')), // 3rd - finished at 49:55, beat target by 5s, gets +15s (min)
        createRunner(4, '5km', '03:00', timeStringToMs('51:00')), // 4th - finished at 51min, slower than target, no change
        createRunner(5, '5km', '02:00', timeStringToMs('52:00'))  // 5th - finished at 52min, slower than target, no change (4th-9th)
      ];

      const results = calculateHandicaps(runners);
      
      expect(results[0].new_handicap).toBe('05:00'); // 04:00 + 1:00 (beat target by 1 min)
      expect(results[1].new_handicap).toBe('05:15'); // 05:00 + 0:15 (minimum for 2nd place)
      expect(results[2].new_handicap).toBe('06:15'); // 06:00 + 0:15 (minimum for 3rd place)
      expect(results[3].new_handicap).toBe('03:00'); // unchanged (4th place)
      expect(results[4].new_handicap).toBe('02:00'); // unchanged (5th place)
    });

    it('should handle mixed distances', () => {
      const runners: Runner[] = [
        createRunner(1, '5km', '05:00', timeStringToMs('49:30')), // 5km: finished at 49:30, beat target (50min) by 30s, gets +30s (min)
        createRunner(2, '10km', '10:00', timeStringToMs('59:30'))  // 10km: finished at 59:30, beat target (60min) by 30s, gets +1min (min)
      ];

      const results = calculateHandicaps(runners);
      
      // Both should be 1st in their respective distances
      expect(results[0].finish_position).toBe(1);
      expect(results[1].finish_position).toBe(1);
      expect(results[0].new_handicap).toBe('05:30'); // 5km 1st place: max(30s, 30s beat) = 30s
      expect(results[1].new_handicap).toBe('11:00'); // 10km 1st place: max(1min, 30s beat) = 1min
    });

    it('should not modify handicaps for runners without finish times', () => {
      const runners: Runner[] = [
        createRunner(1, '5km', '05:00', timeStringToMs('49:30')), // Beat target by 30s, gets handicap adjustment
        {
          member_number: 2,
          full_name: 'Runner 2',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '05:30',
          checked_in: true
          // no finish_time
        }
      ];

      const results = calculateHandicaps(runners);
      
      expect(results[0].new_handicap).toBe('05:30'); // 05:00 + 0:30 (calculated)
      expect(results[1].new_handicap).toBeUndefined(); // Not calculated
    });

    it('should handle minimum handicap of 0', () => {
      // Need 10+ runners to get the penalty
      const runners = [];
      for (let i = 1; i <= 12; i++) {
        runners.push(createRunner(i, '5km', '00:10', timeStringToMs('02:00') + (i * 1000)));
      }
      
      const results = calculateHandicaps(runners);
      
      // First 9 runners have positions 1-9, so get various bonuses or no change
      // Runners 10, 11, 12 get -15s penalty: 00:10 - 00:15 = -00:05, clamped to 00:00
      expect(results[9].new_handicap).toBe('00:00'); // 10th place gets -15s, clamped
      expect(results[10].new_handicap).toBe('00:00'); // 11th place gets -15s, clamped
      expect(results[11].new_handicap).toBe('00:00'); // 12th place gets -15s, clamped
    });

    it('should handle starter/timekeeper status correctly', () => {
      const runners: Runner[] = [
        {
          member_number: 1,
          full_name: 'Starter 10km',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '08:00',
          checked_in: true,
          status: 'starter_timekeeper'
        },
        {
          member_number: 2,
          full_name: 'Starter 5km',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '03:00',
          checked_in: true,
          status: 'starter_timekeeper'
        }
      ];

      const results = calculateHandicaps(runners);
      
      // 10km starter gets -30s
      expect(results[0].new_handicap).toBe('07:30'); // 08:00 - 00:30
      // 5km starter gets no change (N/A in rules)
      expect(results[1].new_handicap).toBe('03:00'); // unchanged
    });
  });
});

describe('Results generation', () => {
  it('should generate podium results correctly', () => {
    const runners: Runner[] = [
      { member_number: 1, full_name: 'Alice', distance: '5km', finish_time: 30000, is_financial_member: true },
      { member_number: 2, full_name: 'Bob', distance: '5km', finish_time: 32000, is_financial_member: true },
      { member_number: 3, full_name: 'Charlie', distance: '5km', finish_time: 35000, is_financial_member: true },
      { member_number: 4, full_name: 'David', distance: '10km', finish_time: 60000, is_financial_member: true },
      { member_number: 5, full_name: 'Eve', distance: '10km', finish_time: 65000, is_financial_member: true },
    ];

    const results = generateResults(runners);
    
    expect(results.fiveKm.podium.first?.full_name).toBe('Alice');
    expect(results.fiveKm.podium.second?.full_name).toBe('Bob');
    expect(results.fiveKm.podium.third?.full_name).toBe('Charlie');
    
    expect(results.tenKm.podium.first?.full_name).toBe('David');
    expect(results.tenKm.podium.second?.full_name).toBe('Eve');
    expect(results.tenKm.podium.third).toBeUndefined();
    
    expect(results.fiveKm.all_finishers).toHaveLength(3);
    expect(results.tenKm.all_finishers).toHaveLength(2);
  });

  it('should handle empty results', () => {
    const results = generateResults([]);
    
    expect(results.fiveKm.podium.first).toBeUndefined();
    expect(results.tenKm.podium.first).toBeUndefined();
    expect(results.fiveKm.all_finishers).toHaveLength(0);
    expect(results.tenKm.all_finishers).toHaveLength(0);
  });
});

describe('CSV parsing', () => {
  const validCSV = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k
331,"John Smith",true,5km,02:15,
200,"Jane Doe",true,10km,,09:30
150,"Bob Wilson",false,5km,03:00,`;

  describe('parseCSV', () => {
    it('should parse valid CSV correctly', () => {
      const runners = parseCSV(validCSV);
      
      expect(runners).toHaveLength(3);
      expect(runners[0]).toEqual({
        member_number: 331,
        full_name: 'John Smith',
        is_financial_member: true,
        distance: '5km',
        current_handicap_5k: '02:15',
        checked_in: false
      });
      expect(runners[1]).toEqual({
        member_number: 200,
        full_name: 'Jane Doe',
        is_financial_member: true,
        distance: '10km',
        current_handicap_10k: '09:30',
        checked_in: false
      });
    });

    it('should handle quoted names with commas', () => {
      const csv = `member_number,full_name,is_financial_member,distance
123,"Smith, John",true,5km`;
      
      const runners = parseCSV(csv);
      expect(runners[0].full_name).toBe('Smith, John');
    });

    it('should handle boolean variations', () => {
      const csv = `member_number,full_name,is_financial_member,distance
100,"Test1",true,5km
101,"Test2",false,5km
102,"Test3",1,5km
103,"Test4",yes,5km
104,"Test5",no,5km`;
      
      const runners = parseCSV(csv);
      expect(runners[0].is_financial_member).toBe(true);
      expect(runners[1].is_financial_member).toBe(false);
      expect(runners[2].is_financial_member).toBe(true);
      expect(runners[3].is_financial_member).toBe(true);
      expect(runners[4].is_financial_member).toBe(false);
    });

    it('should throw error for empty CSV', () => {
      expect(() => parseCSV('')).toThrow('CSV file is empty');
      expect(() => parseCSV('   ')).toThrow('CSV file is empty');
    });

    it('should throw error for missing headers', () => {
      const csv = 'member_number,full_name\n331,"John Smith"';
      expect(() => parseCSV(csv)).toThrow('Missing required CSV headers');
    });

    it('should throw error for invalid member numbers', () => {
      const csv = `member_number,full_name,is_financial_member,distance
abc,"John Smith",true,5km`;
      expect(() => parseCSV(csv)).toThrow('Invalid member number');
    });

    it('should throw error for duplicate member numbers', () => {
      const csv = `member_number,full_name,is_financial_member,distance
331,"John Smith",true,5km
331,"Jane Doe",true,10km`;
      expect(() => parseCSV(csv)).toThrow('Duplicate member number');
    });

    it('should throw error for invalid distances', () => {
      const csv = `member_number,full_name,is_financial_member,distance
331,"John Smith",true,3km`;
      expect(() => parseCSV(csv)).toThrow('Invalid distance');
    });

    it('should throw error for invalid handicap formats', () => {
      const csv = `member_number,full_name,is_financial_member,distance,current_handicap_5k
331,"John Smith",true,5km,2:15`;
      expect(() => parseCSV(csv)).toThrow('Invalid 5K handicap format');
    });
  });

  describe('validateRunnerData', () => {
    it('should return no errors for valid data', () => {
      const runners = parseCSV(validCSV);
      const errors = validateRunnerData(runners);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing handicaps', () => {
      const runners: Runner[] = [{
        member_number: 331,
        full_name: 'John Smith',
        is_financial_member: true,
        distance: '5km',
        checked_in: false
        // missing current_handicap_5k
      }];
      
      const errors = validateRunnerData(runners);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('missing handicap time');
    });

    it('should detect empty names', () => {
      const runners: Runner[] = [{
        member_number: 331,
        full_name: '   ',
        is_financial_member: true,
        distance: '5km',
        current_handicap_5k: '02:15',
        checked_in: false
      }];
      
      const errors = validateRunnerData(runners);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('empty name');
    });
  });
});

describe('CSV export functionality', () => {
  const runners: Runner[] = [
    {
      member_number: 331,
      full_name: 'John Smith',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '02:15',
      new_handicap: '02:30',
      finish_time: 150000,
      finish_position: 1,
      checked_in: true
    },
    {
      member_number: 200,
      full_name: 'Jane Doe',
      is_financial_member: false,
      distance: '10km',
      current_handicap_10k: '09:30',
      new_handicap: '10:00',
      finish_time: 600000,
      finish_position: 1,
      checked_in: true
    }
  ];

  describe('generateNextRaceCSV', () => {
    it('should generate CSV for next race with updated handicaps', () => {
      const csv = generateNextRaceCSV(runners);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k');
      expect(lines[1]).toBe('331,"John Smith",true,5km,02:30,'); // Uses new_handicap
      expect(lines[2]).toBe('200,"Jane Doe",false,10km,,10:00'); // Uses new_handicap
    });
  });

  describe('generateResultsCSV', () => {
    it('should generate results CSV with race data', () => {
      const csv = generateResultsCSV(runners);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('member_number,full_name,distance,status,finish_position,finish_time,old_handicap,new_handicap');
      // 5km comes first due to localeCompare sorting
      expect(lines[1]).toContain('331,"John Smith",5km,finished,1,2:30.0,02:15,02:30');
      expect(lines[2]).toContain('200,"Jane Doe",10km,finished,1,10:00.0,09:30,10:00');
    });

    it('should sort results by distance then position', () => {
      const mixedRunners = [...runners].reverse(); // Reverse order
      const csv = generateResultsCSV(mixedRunners);
      const lines = csv.split('\n');
      
      // Should still be 5km first, then 10km
      expect(lines[1]).toContain('5km');
      expect(lines[2]).toContain('10km');
    });

    it('should include DNF runners in results CSV', () => {
      const runnersWithDNF: Runner[] = [
        {
          member_number: 331,
          full_name: 'John Smith',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:15',
          new_handicap: '02:15',
          status: 'dnf',
          checked_in: true
        }
      ];
      
      const csv = generateResultsCSV(runnersWithDNF);
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('dnf');
      expect(lines[1]).toContain('02:15'); // Handicap unchanged
      expect(lines[1]).toMatch(/,,/); // Empty position and finish_time
    });

    it('should include Early Start runners in results CSV', () => {
      const runnersWithEarlyStart: Runner[] = [
        {
          member_number: 200,
          full_name: 'Jane Doe',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '09:30',
          new_handicap: '09:30',
          status: 'early_start',
          checked_in: true
        }
      ];
      
      const csv = generateResultsCSV(runnersWithEarlyStart);
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('early_start');
      expect(lines[1]).toContain('09:30'); // Handicap unchanged
      expect(lines[1]).toMatch(/,,/); // Empty position and finish_time
    });
  });
});

describe('DNF and Early Start functionality', () => {
  describe('calculateHandicaps with status handling', () => {
    it('should preserve handicaps for DNF runners', () => {
      const runners: Runner[] = [
        {
          member_number: 1,
          full_name: 'Finisher',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:00',
          checked_in: true,
          finish_time: 1500000, // 25:00
        },
        {
          member_number: 2,
          full_name: 'DNF Runner',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:30',
          checked_in: true,
          status: 'dnf' // DNF with no finish time
        }
      ];

      const results = calculateHandicaps(runners);
      
      // Normal finisher gets handicap adjustment
      const finisher = results.find(r => r.member_number === 1);
      expect(finisher?.new_handicap).not.toBe('02:00');
      expect(finisher?.finish_position).toBe(1);
      
      // DNF runner keeps original handicap
      const dnfRunner = results.find(r => r.member_number === 2);
      expect(dnfRunner?.new_handicap).toBe('02:30');
      expect(dnfRunner?.status).toBe('dnf');
      expect(dnfRunner?.finish_position).toBeUndefined();
    });

    it('should preserve handicaps for Early Start runners', () => {
      const runners: Runner[] = [
        {
          member_number: 1,
          full_name: 'Normal Runner',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '08:00',
          checked_in: true,
          finish_time: 3600000, // 60:00
        },
        {
          member_number: 2,
          full_name: 'Early Start Runner',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '09:15',
          checked_in: true,
          status: 'early_start'
        }
      ];

      const results = calculateHandicaps(runners);
      
      // Normal runner gets handicap adjustment
      const normalRunner = results.find(r => r.member_number === 1);
      expect(normalRunner?.new_handicap).not.toBe('08:00');
      
      // Early start runner keeps original handicap
      const earlyStartRunner = results.find(r => r.member_number === 2);
      expect(earlyStartRunner?.new_handicap).toBe('09:15');
      expect(earlyStartRunner?.status).toBe('early_start');
    });

    it('should handle mixed status runners correctly', () => {
      const runners: Runner[] = [
        {
          member_number: 1,
          full_name: 'First Place',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:00',
          checked_in: true,
          finish_time: 1200000, // 20:00
        },
        {
          member_number: 2,
          full_name: 'Second Place',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:30',
          checked_in: true,
          finish_time: 1500000, // 25:00
        },
        {
          member_number: 3,
          full_name: 'DNF Runner',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '01:45',
          checked_in: true,
          status: 'dnf'
        },
        {
          member_number: 4,
          full_name: 'Early Start',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '03:15',
          checked_in: true,
          status: 'early_start'
        }
      ];

      const results = calculateHandicaps(runners);
      
      // Check finished runners get positions and adjusted handicaps
      const first = results.find(r => r.member_number === 1);
      const second = results.find(r => r.member_number === 2);
      expect(first?.finish_position).toBe(1);
      expect(second?.finish_position).toBe(2);
      expect(first?.new_handicap).toBeDefined();
      expect(second?.new_handicap).toBeDefined();
      
      // Check DNF and Early Start keep original handicaps
      const dnfRunner = results.find(r => r.member_number === 3);
      const earlyStartRunner = results.find(r => r.member_number === 4);
      expect(dnfRunner?.new_handicap).toBe('01:45');
      expect(earlyStartRunner?.new_handicap).toBe('03:15');
      expect(dnfRunner?.finish_position).toBeUndefined();
      expect(earlyStartRunner?.finish_position).toBeUndefined();
    });

    it('should ensure all handicap adjustments follow 15-second increment rule', () => {
      // Test scenario where times would produce non-15-second increments without rounding
      const runners: Runner[] = [
        {
          member_number: 1,
          full_name: 'First Runner',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '05:00',
          checked_in: true,
          finish_time: 3540000, // 59 minutes (1 minute early) -> should get 1:00 minimum adjustment
        },
        {
          member_number: 2,
          full_name: 'Second Runner',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '05:30',
          checked_in: true,
          finish_time: 3577000, // 59:37 (38s early) -> should get 45s adjustment (rounded up from 38s)  
        },
        {
          member_number: 3,
          full_name: 'Third Runner',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:00',
          checked_in: true,
          finish_time: 2943000, // 49:03 (57s early) -> should get 1:00 adjustment (rounded up from 57s)
        }
      ];

      const results = calculateHandicaps(runners);

      // Verify all new handicaps end in :00, :15, :30, or :45
      results.forEach(runner => {
        if (runner.new_handicap) {
          const [, seconds] = runner.new_handicap.split(':').map(Number);
          expect(seconds % 15).toBe(0); // Seconds should be multiple of 15
        }
      });

      // Verify specific calculations
      const runner1 = results.find(r => r.member_number === 1);
      const runner2 = results.find(r => r.member_number === 2);
      const runner3 = results.find(r => r.member_number === 3);

      // Expected calculations:
      // Runner1: 1st place 10km, 1min early -> 1:00 minimum adjustment -> 5:00 + 1:00 = 6:00
      // Runner2: 2nd place 10km, 23s early -> 30s minimum adjustment -> 5:30 + 0:30 = 6:00  
      // Runner3: 1st place 5km, 57s early -> 1:00 adjustment (rounded up) -> 2:00 + 1:00 = 3:00
      expect(runner1?.new_handicap).toBe('06:00'); // 5:00 + 1:00 minimum
      expect(runner2?.new_handicap).toBe('06:00'); // 5:30 + 0:30 minimum (30s already 15s increment)
      expect(runner3?.new_handicap).toBe('03:00'); // 2:00 + 1:00 (rounded from 57s)
    });
  });

  describe('CSV export with status', () => {
    it('should export results with status column', () => {
      const runners: Runner[] = [
        {
          member_number: 1,
          full_name: 'John Smith',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:00',
          new_handicap: '02:15',
          finish_time: 1500000,
          finish_position: 1,
          status: 'finished',
          checked_in: true
        },
        {
          member_number: 2,
          full_name: 'Jane Doe',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '02:30',
          new_handicap: '02:30',
          status: 'dnf',
          checked_in: true
        },
        {
          member_number: 3,
          full_name: 'Bob Wilson',
          is_financial_member: true,
          distance: '5km',
          current_handicap_5k: '03:00',
          new_handicap: '03:00',
          status: 'early_start',
          checked_in: true
        }
      ];

      const csv = generateResultsCSV(runners);
      const lines = csv.split('\n');

      // Check header includes status
      expect(lines[0]).toContain('status');
      
      // Check finished runner
      expect(lines[1]).toContain('finished');
      expect(lines[1]).toContain('1'); // Has position
      expect(lines[1]).toContain('25:00.0'); // Has finish time
      
      // Check DNF runner
      expect(lines[2]).toContain('dnf');
      expect(lines[2]).toContain(',,,'); // Empty position and finish_time fields
      
      // Check early start runner
      expect(lines[3]).toContain('early_start');
      expect(lines[3]).toContain(',,,'); // Empty position and finish_time fields
    });

    it('should include starter/timekeeper runners in results CSV', () => {
      const runnersWithStarter: Runner[] = [
        {
          member_number: 100,
          full_name: 'Starter Runner',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '08:00',
          new_handicap: '07:30', // Gets -30s
          status: 'starter_timekeeper',
          checked_in: true
        }
      ];
      
      const csv = generateResultsCSV(runnersWithStarter);
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('starter_timekeeper');
      expect(lines[1]).toContain('07:30'); // Handicap decreased by 30s
      expect(lines[1]).toMatch(/,,/); // Empty position and finish_time
    });
  });
});