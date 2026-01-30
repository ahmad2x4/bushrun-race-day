# Bushrun Race Day PWA - Complete Technical Specification

## Project Overview
A comprehensive offline-first Progressive Web Application for managing monthly handicap races for running clubs, designed for reliable operation on tablets and mobile devices during race events.

## Table of Contents
- [Core Requirements](#core-requirements)
- [Data Models & Types](#data-models--types)
- [Database Architecture](#database-architecture)
- [Business Logic](#business-logic)
- [UI/UX Specifications](#uiux-specifications)
- [PWA Configuration](#pwa-configuration)
- [Development Setup](#development-setup)
- [Export Functionality](#export-functionality)
- [Official References](#official-references)

---

## Core Requirements

### Framework & Tooling
- **React** with **TypeScript** and **Tailwind CSS**
- **Vite** for build tooling
- **IndexedDB** for offline data storage
- **PWA** with service worker for offline functionality

### Key Features
1. **Race Setup**: CSV upload of runners with validation
2. **Self-Service Check-in**: Number pad interface for runners
3. **Race Director View**: Timer and finish recording interface
4. **Results View**: Podium display and handicap calculations
5. **Export Functionality**: CSV export for results and next race

### Technical Requirements
- Offline-first architecture
- Millisecond precision timing
- Concurrent 5K and 10K race support
- Club customization (name, colors, logo)
- Responsive design for all device orientations

---

## Data Models & Types

### TypeScript Interfaces (`src/types.ts`)

```typescript
export interface Runner {
  member_number: number; // Numeric: 331, 200, etc.
  full_name: string;
  is_financial_member: boolean;
  distance: '5km' | '10km';
  current_handicap_5k?: string; // Format: "02:15" (mm:ss)
  current_handicap_10k?: string; // Format: "09:30" (mm:ss)
  new_handicap?: string; // Calculated after race in mm:ss format
  checked_in?: boolean;
  finish_time?: number; // in milliseconds from race start
  finish_position?: number;
  // Championship extensions
  handicap_status?: 'official' | 'provisional' | 'casual';
  points_earned?: number; // Points earned for this race
  championship_eligible?: boolean; // Eligible for championship points
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
  secondary_color: string;
  logo_url?: string;
}

export type AppView = 'setup' | 'checkin' | 'race-director' | 'results' | 'championship';

// BBR Championship System Types (CSV-driven)
export interface ChampionshipRunner extends Runner {
  // Championship tracking fields (from CSV)
  championship_points_5k: number; // Total points earned in 5km races this year
  championship_points_10k: number; // Total points earned in 10km races this year
  races_participated_5k: number; // Number of 5km races participated this year
  races_participated_10k: number; // Number of 10km races participated this year
  handicap_status: 'official' | 'provisional' | 'casual';
}
```

---

## Database Architecture

### IndexedDB Data Layer (`src/db.ts`)

```typescript
class DatabaseManager {
  private dbName = 'bushrun-race-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    // IndexedDB initialization with races and settings stores
  }

  async saveRace(race: Race): Promise<void> { }
  async getRace(id: string): Promise<Race | null> { }
  async getAllRaces(): Promise<Race[]> { }
  async deleteRace(id: string): Promise<void> { }
  
  async saveClubConfig(config: ClubConfig): Promise<void> { }
  async getClubConfig(): Promise<ClubConfig> { 
    // Returns default Berowra Bushrunners config if none exists
  }
}
```

### Database Schema
- **races** store: Race objects with keyPath 'id'
- **settings** store: Club configuration and app settings

---

## Business Logic

### Race Logic & Handicap Calculations (`src/raceLogic.ts`)

#### Time Conversion Utilities
```typescript
export function timeStringToMs(timeStr: string): number {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return (minutes * 60 + seconds) * 1000;
}

export function msToTimeString(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatFinishTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
}
```

#### BBR Handicap Championship Rules

**Championship Overview:**
- Monthly handicapped races on 1st Sunday from February to November (10 races total)
- Both 5km and 10km street course distances
- Courses start/finish at Warrina St Oval car park, Berowra
- 10km course direction alternates each month
- Runners can alternate distances but points don't carry across distances
- Runners under 12 years cannot run 10km course

**Start Times & Handicap System:**
- Common timing clock starts at 7:15am for both races
- Runners with 0:00 handicap start immediately
- All others start when clock shows their handicap time
- Must start at or after official handicap time to be eligible for points
- Target finish times: 5km at 8:05am (50min), 10km at 8:15am (60min)

**Official vs Provisional Handicaps:**
- **Official handicaps** for current financial BBR members who have participated in 2+ handicaps
- **Provisional handicaps** for new runners (adjusted over first 2 runs, becomes official on 3rd)
- Provisional handicap holders do not earn championship points
- Annual rollover: 10km reduced by 30s, 5km reduced by 15s (per [BBR Official Rules](https://berowrabushrunners.com/handicap-2/rules/))

**Starter/Timekeeper Duties:**
- Voluntary positions open to all non-junior members
- Duties: record entrants, assist starts, record finish times
- Rewards: 4 points in 10km championship, handicap reduced by 30s
- Counted as official participation for handicap preservation

**Annual Championship Points System:**
Points awarded based on actual finishing order (official handicap holders only):

| Position | Points |
|----------|--------|
| 1st Place | 20 |
| 2nd Place | 15 |
| 3rd Place | 11 |
| 4th Place | 8 |
| 5th Place | 6 |
| 6th Place | 5 |
| 7th Place | 4 |
| 8th Place | 3 |
| 9th Place | 2 |
| 10th+ Place | 1 |
| Early Start | 1 |
| Did Not Finish | 1 |
| Starter/Timekeeper | 4 |

**Championship Determination:**
- Champion = most points from maximum of 8 race participations
- Tie-breaking sequence:
  1. Most handicap race wins
  2. Most race participations (including starter/timekeeper duties)
  3. Most handicap improvement (time reduction over series)
  4. Most 2nd places, then 3rd places, etc.

**Handicap Adjustment Rules:**

| Result | 10km Handicap | 5km Handicap |
|--------|---------------|--------------|
| 1st Place | +greater of 1min or time beat handicap | +greater of 30s or time beat handicap |
| 2nd Place | +greater of 30s or time beat handicap | +greater of 15s or time beat handicap |
| 3rd Place | +greater of 15s or time beat handicap | +greater of 15s or time beat handicap |
| 4th-9th Place | Unchanged | Unchanged |
| All other finishers | -30 seconds | -15 seconds |
| Early Start/DNF | Unchanged | Unchanged |
| Starter/Timekeeper | -30 seconds | N/A |

#### CSV Processing & Championship Integration

**CSV Format for Championship Tracking:**
```
member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k,handicap_status,championship_points_5k,championship_points_10k,races_participated_5k,races_participated_10k
331,John Smith,true,10km,,09:30,official,45,0,0,3
200,Jane Doe,true,5km,02:15,,provisional,0,0,2,0
```

**File Naming Convention:**
- **Import**: `bbr-runners-2024-02.csv` (Year-Month for race setup)
- **Export Results**: `bbr-results-2024-02.csv` (Race results with points earned)
- **Export Next Race**: `bbr-runners-2024-03.csv` (Updated handicaps and cumulative points)

```typescript
export function parseChampionshipCSV(csvText: string): ChampionshipRunner[] {
  // Validates CSV format with championship fields
  // Validates member_number as integer
  // Validates distance as '5km' or '10km'
  // Validates handicap time format (MM:SS)
  // Validates championship points as integers
  // Validates handicap_status as 'official' | 'provisional' | 'casual'
  // Returns array of ChampionshipRunner objects
}

export function validateChampionshipData(runners: ChampionshipRunner[]): string[] {
  // Checks for duplicate member numbers
  // Validates runners have handicap for their distance
  // Validates championship points are non-negative
  // Validates participation counts match points logic
  // Returns array of validation errors
}

export function generateChampionshipResultsCSV(runners: ChampionshipRunner[], raceDate: string): string {
  // Creates results CSV with race data including points earned
  // Headers: member_number, full_name, distance, finish_position, finish_time, 
  //          points_earned, total_points_5k, total_points_10k, new_handicap
}

export function generateNextRaceCSV(runners: ChampionshipRunner[], nextRaceDate: string): string {
  // Creates CSV for next race with updated handicaps and cumulative championship points
  // Headers: member_number, full_name, is_financial_member, distance, current_handicap_5k, 
  //          current_handicap_10k, handicap_status, championship_points_5k, 
  //          championship_points_10k, races_participated_5k, races_participated_10k
}
```

---

## UI/UX Specifications

### Responsive Design System

#### Breakpoints
```css
/* Mobile Portrait: 320-480px */
@media (max-width: 480px) and (orientation: portrait) { }

/* Mobile Landscape: 481-767px */
@media (min-width: 481px) and (max-width: 767px) and (orientation: landscape) { }

/* Tablet Portrait: 768-1024px */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) { }

/* Tablet Landscape: 768-1024px - Optimal for Race Directors */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) { }
```

#### Fat-Finger Proof Touch Targets
- **Minimum**: 48px × 48px (Apple/Google standard)
- **Standard**: 56px × 56px (regular buttons)
- **Primary**: 72px × 72px (important actions)
- **Runner Buttons**: 96px × 96px (tablet) / 80px × 80px (mobile)
- **Number Pad**: 72px × 72px (mobile) / 100px × 100px (tablet)

#### Typography Scale
```css
:root {
  /* Mobile bases */
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;
  --text-5xl: 48px;
  --text-6xl: 60px;
}

/* Tablet adjustments */
@media (min-width: 768px) and (orientation: landscape) {
  :root {
    --text-6xl: 96px;
    --text-5xl: 72px;
    --text-4xl: 56px;
  }
}
```

### Device-Specific Layouts

#### Mobile Portrait (320-480px)
- Single column layout
- 2×N runner grid
- Timer: 64px font
- Number pad: 72px buttons with 12px gaps

#### Mobile Landscape (481-767px)
- Sidebar (180px) + main content
- 4×N runner grid
- Compact timer in sidebar

#### Tablet Portrait (768-1024px)
- 5×N runner grid
- Timer: 96px font
- Number pad: 100px buttons with 20px gaps
- Generous 24px padding throughout

#### Tablet Landscape (768-1024px) - Primary Race Director Interface
- Sidebar (220px) with timer and controls
- 6×N runner grid
- Timer: 64px font in sidebar
- Race stats panel
- Maximum information density

### Component Specifications

#### Race Director View
```typescript
interface RaceDirectorState {
  raceTimer: number; // Single timer for both races
  isTimerRunning: boolean;
  selectedDistance: '5km' | '10km' | 'both';
}

// Layout:
// - Large timer display (single for both races)
// - Distance filter tabs [5K] [10K] [Both]
// - Runner grid with color-coded distance badges
// - Touch-optimized finish recording
```

#### Check-in View
- Large number display
- Grid number pad (3×4 layout)
- Clear/backspace functionality
- Runner confirmation display

#### Results View
- Separate podium sections for 5K and 10K
- Tabbed interface: [5K Results] [10K Results] [Combined]
- Export buttons prominently displayed
- Scrollable results table

### Accessibility Features
- WCAG 2.1 AA compliance
- Screen reader support with semantic HTML and ARIA labels
- High contrast mode compatibility
- Keyboard navigation support
- Reduced motion preferences
- Focus indicators (3px outline with club primary color)

---

## PWA Configuration

### Manifest (`public/manifest.json`)
```json
{
  "name": "Bushrun Race Day",
  "short_name": "Bushrun",
  "description": "Offline-first race management for running clubs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1f2937",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "categories": ["sports", "utilities"],
  "lang": "en"
}
```

### Service Worker (`public/service-worker.js`)
```javascript
const CACHE_NAME = 'bushrun-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache all assets
// Fetch event - cache-first strategy for offline functionality
```

---

## Development Setup

### Project Structure
```
bushrun-race-day/
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── App.tsx          # Main application component
│   ├── types.ts         # TypeScript interfaces
│   ├── db.ts           # IndexedDB operations
│   ├── raceLogic.ts    # Business logic
│   ├── index.css       # Tailwind imports
│   └── main.tsx        # React entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "vite-plugin-pwa": "^0.16.0"
  }
}
```

### Vite Configuration
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
})
```

---

## Export Functionality

### CSV Generation for Next Race
```typescript
export function generateNextRaceCSV(runners: Runner[]): string {
  // Creates CSV with updated handicaps ready for next race
  // Headers: member_number, full_name, is_financial_member, distance, current_handicap_5k, current_handicap_10k
  // Uses new_handicap as current_handicap for next race
}

export function generateResultsCSV(runners: Runner[], raceDate: string): string {
  // Creates results CSV with race data
  // Headers: member_number, full_name, distance, finish_position, finish_time, old_handicap, new_handicap
}

export function downloadCSV(filename: string, csvContent: string): void {
  // Browser download helper using Blob and temporary link
}
```

### File Naming Convention
- Results: `bushrun-results-YYYY-MM-DD.csv`
- Next Race: `bushrun-next-race-YYYY-MM-DD.csv`

---

## Race Flow Summary

1. **Setup Phase**
   - Upload CSV with runners and distance-specific handicaps
   - Validate data and preview runners
   - Configure race settings

2. **Check-in Phase**
   - Runners self-register using number pad interface
   - Display confirmation with name and distance
   - Track check-in status

3. **Race Phase**
   - Single timer for both 5K and 10K (same start time)
   - Distance-filtered runner grid
   - Touch-optimized finish time recording
   - Real-time race statistics

4. **Results Phase**
   - Automatic handicap calculations
   - Separate 5K and 10K podiums
   - Full results table with new handicaps
   - CSV export for results and next race preparation

---

## Club Customization

### White-labeling Support
- Club name configuration
- Primary and secondary color theming
- Logo upload and display
- CSS custom properties for theming

### Default Configuration
- **Name**: "Berowra Bushrunners"
- **Primary Color**: "#3b82f6" (blue-600)
- **Secondary Color**: "#1f2937" (gray-800)

---

## Technical Considerations

### Performance
- IndexedDB for fast offline data access
- Virtual scrolling for large runner lists (if needed)
- Debounced search and filtering
- Optimized re-renders with React.memo

### Error Handling
- CSV validation with detailed error messages
- Network failure graceful degradation
- Data corruption recovery
- User-friendly error displays

### Security
- Input sanitization for CSV data
- XSS prevention in dynamic content
- Data validation at all layers

---

## Official References

This application implements rules and procedures from the official Berowra Bushrunners organization:

- **BBR Handicap Rules**: https://berowrabushrunners.com/handicap-2/rules/
  - Annual handicap rollover: 10km reduced by 30s, 5km reduced by 15s
  - Official vs. Provisional handicap criteria
  - Championship eligibility requirements
  - Start time protocols and race procedures

---

This specification provides a complete roadmap for implementing the Bushrun Race Day PWA with professional-grade offline functionality, responsive design, and race management capabilities optimized for running clubs.