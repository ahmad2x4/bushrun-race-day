# BBR Championship System Specification

## Overview
This document outlines the complete Championship System implementation for the Bushrun Race Day application. This is a future enhancement that will extend the current race management system with comprehensive championship tracking and scoring.

## Phase 1: Championship CSV Integration ✨ SIMPLE & EFFECTIVE

### Enhanced CSV Format Support
- **Task**: Update Runner type to ChampionshipRunner with points fields
- **Details**:
  - Add championship_races_5k, championship_races_10k (race history as "MONTH:POSITION:POINTS:TIME|...", e.g., "2:1:20:895|3:2:15:920|4:3:11:940" for Feb, Mar, Apr races)
    - MONTH: Race month (2-11 for Feb-Nov)
    - POSITION: Finish position (1-10+) or special (ST=starter, DNF=did not finish, ES=early start)
    - POINTS: Points earned (20, 15, 11, 8, 6, 5, 4, 3, 2, 1)
    - TIME: Finish time in seconds (0 for ST/DNF/ES)
  - Add championship_points_5k, championship_points_10k (current total points from best 8 races)
  - Use existing is_official_5k, is_official_10k fields for championship eligibility
  - Update CSV parser to handle championship fields and enhanced race history format
- **Impact**: Foundation for championship tracking with complete race history including positions and times

### Championship Points Calculation Engine
- **Task**: Implement BBR official points calculation
- **Details**:
  - Implement BBR official points table (20-15-11-8-6-5-4-3-2-1)
  - Add special case handling: Early start (1pt), DNF (1pt), Starter/Timekeeper (4pts)
  - Calculate points based on finish position and championship eligibility
  - Only award points to runners with is_official_5k/is_official_10k set to true
  - Append race result to championship_races_5k/10k as "MONTH:POSITION:POINTS:TIME" (e.g., "2:1:20:895" for February race, 1st place, 20 points, 14:55 time; "3:ST:4:0" for March starter/timekeeper)
  - Calculate best 8 races from race history and update championship_points totals
- **Impact**: Core championship functionality

## Phase 2: Championship UI & Results Integration 🎨 

### Championship-Enhanced Results View
- **Task**: Display championship data in results
- **Details**:
  - Display points earned alongside race positions
  - Show championship eligibility status (is_official_5k/10k) for each runner
  - Add championship leaderboard section (5km & 10km separate)
  - Display current season totals and race participation count from CSV data
  - Show complete race history for each runner
- **Impact**: User-facing championship features

### Championship CSV Export
- **Task**: Update export functionality for championship data
- **Details**:
  - Update generateNextRaceCSV() with championship fields
  - Include championship_races_5k/10k (race history strings)
  - Include championship_points_5k/10k (best 8 totals)
  - Use year-month naming convention (bbr-runners-2024-03.csv)
  - Generate results CSV with points earned per race
- **Impact**: Championship data persistence

## Phase 3: Championship Dashboard View 📈

### Championship Leaderboard
- **Task**: Create championship leaderboard interface
- **Details**:
  - Parse championship data from uploaded CSV
  - Display current 5km and 10km standings
  - Show top 8 race results (max counting races)
  - Calculate and display tie-breaking information
- **Impact**: Championship standings visibility

### Runner Championship Details
- **Task**: Individual runner championship tracking
- **Details**:
  - Individual runner championship summary
  - Points breakdown from complete race history
  - Championship eligibility status (is_official_5k/10k)
  - Progress towards 8-race maximum (derived from race history length)
  - Show which races count towards best 8
- **Impact**: Detailed runner insights

## Phase 4: Championship Logic & Validation 🔧

### 8-Race Maximum Logic
- **Task**: Implement race participation limits
- **Details**:
  - Parse championship_races_5k/10k to count participation (split by '|' to get MONTH:POSITION:POINTS:TIME entries, then split by ':')
  - Display which races count towards championship (best 8 from history)
  - Sort race history by points (3rd field) to select best 8 results
  - Allow runners to participate in 10+ races but only count best 8
  - Update championship_points totals based on best 8 calculation
- **Impact**: Official championship rules compliance

### Tie-Breaking Implementation
- **Task**: Handle championship ties using official BBR rules
- **Details**:
  - **Phase 1 Implementation (Current)**:
    - Most race wins: Count entries with POSITION=1 in race history
    - Most participations: Count all MONTH:POSITION:POINTS:TIME entries by splitting on '|'
  - **Future Phases (Deferred)**:
    - Greatest handicap time improvement over the series (use TIME field for future enhancement)
    - Most second-place finishes, then thirds, etc. through all eight races (use POSITION field for future enhancement)
  - Parse championship_races_5k/10k by splitting on '|' to get individual MONTH:POSITION:POINTS:TIME entries, then split by ':' to extract fields
  - Display tie-breaking criteria in standings
  - Comprehensive testing with various scenarios
  - Note: Full BBR tie-breaking has 4 criteria; Phase 1 implements first 2 which resolve most ties
- **Impact**: Fair championship resolution aligned with official BBR rules

## Phase 5: Annual Rollover & New Season Support 🔄

### New Season CSV Generation
- **Task**: Annual rollover functionality
- **Details**:
  - Annual handicap rollover (10km: -30s, 5km: -15s) per [BBR Official Rules](https://berowrabushrunners.com/handicap-2/rules/)
  - Clear championship_races_5k/10k (empty race history)
  - Reset championship_points_5k/10k to zero
  - Maintain is_official_5k/10k status for continuing members
  - Generate fresh season starter CSV
- **Impact**: Season transition automation

### Season Archive & History
- **Task**: Historical data management
- **Details**:
  - Export final season standings CSV
  - Generate championship winner certificates/reports
  - Clear interface for season transition
  - Preserve final results for record keeping
- **Impact**: Long-term data preservation

## Technical Requirements

### Data Structure Changes
```typescript
interface ChampionshipRunner extends Runner {
  // New championship fields (4 total)
  championship_races_5k: string;   // "MONTH:POSITION:POINTS:TIME|..." e.g., "2:1:20:895|3:2:15:920|4:3:11:940"
  championship_races_10k: string;  // "MONTH:POSITION:POINTS:TIME|..."
  championship_points_5k: number;  // Current total (best 8 races)
  championship_points_10k: number; // Current total (best 8 races)

  // Existing fields reused for championship eligibility
  // is_official_5k: boolean;      // Already exists in Runner type, set by race director after 2 races
  // is_official_10k: boolean;     // Already exists in Runner type, set by race director after 2 races
}
```

### CSV Example
```csv
member_number,name,handicap_5k,handicap_10k,is_official_5k,is_official_10k,championship_races_5k,championship_points_5k,championship_races_10k,championship_points_10k
123,John Smith,180,360,true,true,"2:1:20:895|3:2:15:920|4:3:11:940|5:4:8:960|6:1:20:880|7:2:15:905|8:3:11:935|9:4:8:950",108,"2:1:20:1820|3:2:15:1850",35
456,Jane Doe,200,400,true,false,"2:2:15:920|3:3:11:940|4:ST:4:0",30,"",0
789,New Runner,220,440,false,false,"",0,"",0
```

### Points Table
- 1st: 20 points
- 2nd: 15 points  
- 3rd: 11 points
- 4th: 8 points
- 5th: 6 points
- 6th: 5 points
- 7th: 4 points
- 8th: 3 points
- 9th: 2 points
- 10th+: 1 point

### Special Cases
- Early start: 1 point
- DNF (Did Not Finish): 1 point
- Starter/Timekeeper: 4 points

### Championship Rules
- Only runners with is_official_5k/is_official_10k set to true earn championship points
- Runners can participate in unlimited races per season
- Maximum 8 races count towards championship per distance (best 8 selected)
- Best 8 results are automatically calculated by sorting race history by points
- **Tie-breaking (Phase 1 Implementation)**:
  - Most race wins (count entries with POSITION=1)
  - Most race participations (total entry count)
  - *Future phases: Handicap time improvement, position frequency analysis*
- Race history format: "MONTH:POSITION:POINTS:TIME" pipe-delimited (e.g., "2:1:20:895|3:2:15:920|4:3:11:940" for Feb, Mar, Apr races with times in seconds)
- Participation count derived from race history: split('|').length

### Provisional Handicaps
- New runners receive provisional handicaps initially
- After two races, race directors manually update is_official_5k/is_official_10k to true
- Only runners with is_official status (true) earn championship points
- App does not automatically promote runners; promotion is a manual process

### Testability and unit tests
- Make sure the championship is a testable unit (code)
- Unit test when possible

---
*Future enhancement specification - to be implemented after core functionality is complete*