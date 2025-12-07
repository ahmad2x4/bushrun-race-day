export type RunnerStatus = 'finished' | 'dnf' | 'early_start' | 'starter_timekeeper';

export interface Runner {
  member_number: number; // Numeric: 331, 200, etc.
  full_name: string;
  is_financial_member: boolean;
  distance: '5km' | '10km';
  current_handicap_5k?: string; // Format: "02:15" (mm:ss) - start delay time
  current_handicap_10k?: string; // Format: "09:30" (mm:ss) - start delay time
  new_handicap?: string; // Calculated after race in mm:ss format - new start delay
  checked_in?: boolean;
  finish_time?: number; // in milliseconds from race start
  finish_position?: number;
  status?: RunnerStatus; // Track DNF, Early Start, or normal finish
  is_official_5k?: boolean; // Default: true - Has participated in 2+ 5km handicaps (including Starter/Timekeeper)
  is_official_10k?: boolean; // Default: true - Has participated in 2+ 10km handicaps (including Starter/Timekeeper)
}

export interface Race {
  id: string;
  name: string;
  date: string;
  status: 'setup' | 'checkin' | 'active' | 'finished';
  start_time?: number; // timestamp in milliseconds
  runners: Runner[];
  // Both races run simultaneously but tracked separately
  race_5k_active: boolean;
  race_10k_active: boolean;
  next_temp_number: number; // Track next available temp number for new members (starts at 999, decrements)
}

export interface RaceResults {
  distance: '5km' | '10km';
  podium: {
    first?: Runner;
    second?: Runner;
    third?: Runner;
  };
  all_finishers: Runner[];
}

export interface ClubConfig {
  name: string;
  primary_color: string;
  secondary_color?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  enable_time_adjustment?: boolean; // Default: true - Allow runners to adjust start delay time during check-in
  audio_enabled?: boolean; // Default: true - Enable start beep sounds
  audio_volume?: number; // Default: 0.5 - Volume level (0.0 to 1.0)
}

export type AppView = 'setup' | 'checkin' | 'race-director' | 'results' | 'settings';

// UI State interfaces
export interface RaceDirectorState {
  raceTimer: number; // Single timer for both races
  isTimerRunning: boolean;
  selectedDistance: '5km' | '10km' | 'both';
}

export interface AppState {
  currentRace: Race | null;
  currentView: AppView;
  isDarkMode: boolean;
  clubConfig: ClubConfig;
}

// Utility types for form handling
export interface ValidationError {
  field: string;
  message: string;
}

export interface CSVUploadResult {
  success: boolean;
  runners?: Runner[];
  errors?: ValidationError[];
}