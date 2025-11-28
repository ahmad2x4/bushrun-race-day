# Cross-Distance Handicap Implementation Plan

## Overview
Implement cross-distance handicap calculations that work seamlessly - just show a simple warning on the check-in card when
using calculated handicaps.

## 1. Core Calculation Functions (`/src/raceLogic.ts`)

### New Functions:
```typescript
// Round to nearest 15 seconds
function roundToNearest15Seconds(timeMs: number): number

// Convert 10k handicap to 5k using the provided formula
function convert10kTo5k(handicap10k: string): string

// Convert 5k handicap to 10k using the provided formula
function convert5kTo10k(handicap5k: string): string

// Get handicap for any distance (official or calculated)
function getHandicapForDistance(runner: Runner, distance: '5km' | '10km'): {
  handicap: string,
  isCalculated: boolean
}

Formula Implementation:

- 10k → 5k: 5/6*1/24-(1/24-handicap_value)/2.1 rounded to 15 seconds
- 5k → 10k: 1/24-(5/6*1/24-handicap_value)*2.1 rounded to 15 seconds
- Return null if no handicap available for conversion
- Handle time format conversion (MM:SS ↔ milliseconds)

2. CheckinView Integration (/src/components/views/CheckinView.tsx)

Update Time Display Card:

- When runner selects distance they don't have handicap for, calculate from other distance
- Show calculated time normally in the big display: e.g. 07:25
- Add single line below: "Calculated from [5k/10k] handicap"
- Time adjustment buttons work exactly the same
- No other changes to the UI flow

Updated Card Layout:

🏃‍♂️ YOUR START DELAY TIME 🏃‍♀️
        07:25
[−]              [+]

Calculated from 5k handicap

You will start 07:25 after the race begins
💡 Lower times = Earlier start • Higher times = Later start

3. Data Handling

Simple Approach:

- Calculate handicaps on-the-fly during check-in
- Treat this time as if it was unofficial 
- No special validation or approval needed

4. Results Display

Minimal Changes:

- No separate sections or warnings
- Everything else works exactly the same

5. Implementation Steps

Phase 1: Add Calculation Functions

1. Implement the two conversion formulas
2. Add function to get handicap (official or calculated)
3. Unit tests for formula accuracy

Phase 2: Update Check-in UI

1. Modify distance selection to use calculated handicaps when needed
2. Add simple "Calculated from X handicap" text to the card
3. Ensure time adjustments work normally

Phase 3: Results Integration

1. Track which runners used calculated handicaps
2. No other changes needed

6. User Experience

Seamless Flow:

1. Runner selects distance they don't have handicap for
2. System automatically calculates from other distance
3. Shows calculated time with simple note: "Calculated from 5k handicap"
4. Everything else works exactly the same

This approach treats calculated handicaps as first-class citizens with just a simple notification on the check-in card.