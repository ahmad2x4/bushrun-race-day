# BBR Championship System Specification

## Overview
This document outlines the complete Championship System implementation for the Bushrun Race Day application. This is a future enhancement that will extend the current race management system with comprehensive championship tracking and scoring.

## Phase 1: Championship CSV Integration ✨ SIMPLE & EFFECTIVE

### Enhanced CSV Format Support
- **Task**: Update Runner type to ChampionshipRunner with points fields
- **Details**: 
  - Add championship_points_5k, championship_points_10k fields
  - Add races_participated_5k, races_participated_10k counters
  - Add handicap_status: 'official' | 'provisional' | 'casual'
  - Update CSV parser to handle championship fields
- **Impact**: Foundation for championship tracking

### Championship Points Calculation Engine
- **Task**: Implement BBR official points calculation
- **Details**:
  - Implement BBR official points table (20-15-11-8-6-5-4-3-2-1)
  - Add special case handling: Early start (1pt), DNF (1pt), Starter/Timekeeper (4pts)
  - Calculate points based on finish position and handicap status
  - Only award points to 'official' handicap holders
  - Update cumulative points after each race
- **Impact**: Core championship functionality

## Phase 2: Championship UI & Results Integration 🎨 

### Championship-Enhanced Results View
- **Task**: Display championship data in results
- **Details**:
  - Display points earned alongside race positions
  - Show championship status (official/provisional/casual) for each runner
  - Add championship leaderboard section (5km & 10km separate)
  - Display current season totals from CSV data
- **Impact**: User-facing championship features

### Championship CSV Export
- **Task**: Update export functionality for championship data
- **Details**:
  - Update generateNextRaceCSV() with championship fields
  - Include cumulative points and participation counts
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
  - Points breakdown and race participation history
  - Handicap status and eligibility information
  - Progress towards 8-race maximum
- **Impact**: Detailed runner insights

## Phase 4: Championship Logic & Validation 🔧

### 8-Race Maximum Logic
- **Task**: Implement race participation limits
- **Details**:
  - Track participation count per distance
  - Display which races count towards championship
  - Handle race selection for best 8 results
  - Update CSV exports with participation tracking
- **Impact**: Official championship rules compliance

### Tie-Breaking Implementation
- **Task**: Handle championship ties
- **Details**:
  - Most race wins comparison (from CSV history)
  - Most participations including starter/timekeeper
  - Display tie-breaking criteria in standings
  - Comprehensive testing with various scenarios
- **Impact**: Fair championship resolution

## Phase 5: Annual Rollover & New Season Support 🔄

### New Season CSV Generation
- **Task**: Annual rollover functionality
- **Details**:
  - Annual handicap rollover (10km: -30s, 5km: -15s)
  - Reset championship points to zero
  - Reset participation counters
  - Maintain handicap_status for continuing members
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
  championship_points_5k: number;
  championship_points_10k: number;
  races_participated_5k: number;
  races_participated_10k: number;
  handicap_status: 'official' | 'provisional' | 'casual';
}
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
- Only runners with 'official' handicap status earn points
- Maximum 8 races count towards championship per distance
- Best 8 results are automatically selected
- Tie-breaking: Most wins, then most participations

---
*Future enhancement specification - to be implemented after core functionality is complete*