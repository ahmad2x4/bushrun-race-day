/**
 * Test data fixtures for E2E testing
 * Contains sample race data, CSV content, and test scenarios
 */

export interface TestRunner {
  member_number: number;
  full_name: string;
  is_financial_member: boolean;
  distance: '5km' | '10km';
  current_handicap_5k?: string;
  current_handicap_10k?: string;
  handicap_status: 'official' | 'provisional' | 'casual';
  championship_points_5k: number;
  championship_points_10k: number;
  races_participated_5k: number;
  races_participated_10k: number;
}

export const TEST_RUNNERS: TestRunner[] = [
  {
    member_number: 331,
    full_name: 'John Smith',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '09:30',
    handicap_status: 'official',
    championship_points_5k: 0,
    championship_points_10k: 45,
    races_participated_5k: 0,
    races_participated_10k: 3,
  },
  {
    member_number: 200,
    full_name: 'Jane Doe',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '02:15',
    handicap_status: 'provisional',
    championship_points_5k: 12,
    championship_points_10k: 0,
    races_participated_5k: 2,
    races_participated_10k: 0,
  },
  {
    member_number: 150,
    full_name: 'Mike Johnson',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '08:45',
    handicap_status: 'official',
    championship_points_5k: 0,
    championship_points_10k: 28,
    races_participated_5k: 0,
    races_participated_10k: 2,
  },
  {
    member_number: 275,
    full_name: 'Sarah Wilson',
    is_financial_member: false,
    distance: '5km',
    current_handicap_5k: '03:30',
    handicap_status: 'casual',
    championship_points_5k: 0,
    championship_points_10k: 0,
    races_participated_5k: 0,
    races_participated_10k: 0,
  },
  {
    member_number: 180,
    full_name: 'Tom Brown',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '07:15',
    handicap_status: 'official',
    championship_points_5k: 0,
    championship_points_10k: 19,
    races_participated_5k: 0,
    races_participated_10k: 2,
  },
];

export const LARGE_TEST_FIELD: TestRunner[] = [
  ...TEST_RUNNERS,
  ...Array.from({ length: 25 }, (_, i) => ({
    member_number: 400 + i,
    full_name: `Test Runner ${i + 6}`,
    is_financial_member: i % 2 === 0,
    distance: (i % 3 === 0 ? '5km' : '10km') as '5km' | '10km',
    current_handicap_5k: i % 3 === 0 ? '02:45' : undefined,
    current_handicap_10k: i % 3 !== 0 ? '08:30' : undefined,
    handicap_status: (i % 4 === 0 ? 'provisional' : 'official') as 'official' | 'provisional',
    championship_points_5k: i % 3 === 0 ? 5 + i : 0,
    championship_points_10k: i % 3 !== 0 ? 8 + i : 0,
    races_participated_5k: i % 3 === 0 ? 1 : 0,
    races_participated_10k: i % 3 !== 0 ? 1 : 0,
  })),
];

/**
 * Generate CSV content from runner data
 */
export function generateTestCSV(runners: TestRunner[]): string {
  const headers = [
    'member_number',
    'full_name',
    'is_financial_member',
    'distance',
    'current_handicap_5k',
    'current_handicap_10k',
    'handicap_status',
    'championship_points_5k',
    'championship_points_10k',
    'races_participated_5k',
    'races_participated_10k'
  ];

  const csvRows = runners.map(runner => [
    runner.member_number,
    runner.full_name,
    runner.is_financial_member,
    runner.distance,
    runner.current_handicap_5k || '',
    runner.current_handicap_10k || '',
    runner.handicap_status,
    runner.championship_points_5k,
    runner.championship_points_10k,
    runner.races_participated_5k,
    runner.races_participated_10k
  ]);

  return [headers, ...csvRows]
    .map(row => row.join(','))
    .join('\n');
}

/**
 * Pre-generated CSV content for quick testing
 */
export const VALID_TEST_CSV = generateTestCSV(TEST_RUNNERS);

export const LARGE_FIELD_CSV = generateTestCSV(LARGE_TEST_FIELD);

/**
 * Invalid CSV data for error testing
 */
export const INVALID_CSV_MISSING_HEADERS = `member_number,name
331,John Smith
200,Jane Doe`;

export const INVALID_CSV_BAD_MEMBER_NUMBERS = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,handicap_status,championship_points_5k,championship_points_10k,races_participated_5k,races_participated_10k
abc,John Smith,true,10km,,09:30,official,45,0,0,3
200,Jane Doe,true,5km,02:15,,provisional,0,0,2,0`;

export const INVALID_CSV_BAD_DISTANCE = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,handicap_status,championship_points_5k,championship_points_10k,races_participated_5k,races_participated_10k
331,John Smith,true,15km,,09:30,official,45,0,0,3
200,Jane Doe,true,marathon,02:15,,provisional,0,0,2,0`;

export const INVALID_CSV_BAD_HANDICAP_FORMAT = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,handicap_status,championship_points_5k,championship_points_10k,races_participated_5k,races_participated_10k
331,John Smith,true,10km,,9:30,official,45,0,0,3
200,Jane Doe,true,5km,2:5,,provisional,0,0,2,0`;

export const DUPLICATE_MEMBER_NUMBERS_CSV = `member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,handicap_status,championship_points_5k,championship_points_10k,races_participated_5k,races_participated_10k
331,John Smith,true,10km,,09:30,official,45,0,0,3
331,Jane Doe,true,5km,02:15,,provisional,0,0,2,0`;

/**
 * Test scenarios for different race conditions
 */
export const TEST_SCENARIOS = {
  SMALL_RACE: {
    name: 'Small Race Test',
    runners: TEST_RUNNERS,
    csv: VALID_TEST_CSV,
    description: 'Basic race with 5 participants for core functionality testing',
  },
  LARGE_RACE: {
    name: 'Large Race Test', 
    runners: LARGE_TEST_FIELD,
    csv: LARGE_FIELD_CSV,
    description: 'Large race with 30 participants for performance and UI testing',
  },
  ONLY_5K: {
    name: '5K Only Race',
    runners: TEST_RUNNERS.filter(r => r.distance === '5km'),
    csv: generateTestCSV(TEST_RUNNERS.filter(r => r.distance === '5km')),
    description: 'Race with only 5km participants',
  },
  ONLY_10K: {
    name: '10K Only Race',
    runners: TEST_RUNNERS.filter(r => r.distance === '10km'),
    csv: generateTestCSV(TEST_RUNNERS.filter(r => r.distance === '10km')),
    description: 'Race with only 10km participants',
  },
  MIXED_HANDICAP_STATUS: {
    name: 'Mixed Handicap Status',
    runners: [
      ...TEST_RUNNERS.slice(0, 2), // Official
      { ...TEST_RUNNERS[2], handicap_status: 'provisional' as const },
      { ...TEST_RUNNERS[3], handicap_status: 'casual' as const },
    ],
    csv: generateTestCSV([
      ...TEST_RUNNERS.slice(0, 2),
      { ...TEST_RUNNERS[2], handicap_status: 'provisional' as const },
      { ...TEST_RUNNERS[3], handicap_status: 'casual' as const },
    ]),
    description: 'Race with mixed handicap statuses (official, provisional, casual)',
  },
} as const;

/**
 * Expected finish times for testing race simulation
 * Times are in milliseconds from race start
 */
export const EXPECTED_FINISH_TIMES = {
  [331]: 2534500, // John Smith - 42:14.5
  [200]: 1825300, // Jane Doe - 30:25.3  
  [150]: 2756800, // Mike Johnson - 45:56.8
  [275]: 2145600, // Sarah Wilson - 35:45.6
  [180]: 2456700, // Tom Brown - 40:56.7
};

/**
 * Expected race results for testing calculations
 */
export const EXPECTED_RACE_RESULTS = {
  PODIUM_5K: [
    { position: 1, member_number: 200, name: 'Jane Doe' },
    { position: 2, member_number: 275, name: 'Sarah Wilson' },
  ],
  PODIUM_10K: [
    { position: 1, member_number: 331, name: 'John Smith' },
    { position: 2, member_number: 180, name: 'Tom Brown' },
    { position: 3, member_number: 150, name: 'Mike Johnson' },
  ],
  POINTS_EARNED: {
    [331]: 20, // 1st place 10km
    [200]: 15, // 1st place 5km (provisional gets points too)
    [150]: 11, // 3rd place 10km
    [275]: 0,  // Casual member gets no points
    [180]: 15, // 2nd place 10km
  },
};

/**
 * Test data for championship scenarios
 */
export const CHAMPIONSHIP_TEST_DATA = {
  RUNNER_WITH_HIGH_POINTS: {
    member_number: 999,
    full_name: 'Championship Leader',
    is_financial_member: true,
    distance: '10km' as const,
    current_handicap_10k: '07:00',
    handicap_status: 'official' as const,
    championship_points_5k: 0,
    championship_points_10k: 156, // Close to max 8 races × 20 points
    races_participated_5k: 0,
    races_participated_10k: 8,
  },
  RUNNER_NEAR_MAX_RACES: {
    member_number: 998,
    full_name: 'Race Regular',
    is_financial_member: true,
    distance: '5km' as const,
    current_handicap_5k: '02:00',
    handicap_status: 'official' as const,
    championship_points_5k: 87,
    championship_points_10k: 0,
    races_participated_5k: 7, // One race away from max
    races_participated_10k: 0,
  },
};