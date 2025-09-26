# Bushrun Race Day - Development Backlog

## 🎉 Major Development Complete!

All core features and infrastructure have been successfully implemented and are production-ready.

## 🚧 Active Development Items

### 1. **BBR "Two Handicaps" Rule Implementation**
- **Priority**: High
- **User Story**: "As a race director, I need to track which runners have participated in 2+ handicap races (including Starter/Timekeeper duties) so that only qualified runners receive official handicap status and championship points."
- **BBR Rule**: Runners must have participated in two or more handicap races in current or prior membership year to have official handicap status
- **Requirements**:
  - Add `is_official_5k` and `is_official_10k` boolean fields to CSV input/output
  - During check-in, ask provisional runners about their participation history
  - Update runner status to official if they confirm 2+ participations
  - Display official/provisional status in Setup preview
  - Export updated status flags for next race
- **Technical Implementation**:
  - Update Runner interface with new boolean fields (default: true for backward compatibility)
  - Modify CSV parser to handle new fields with fallback to true if missing
  - Add confirmation popup in CheckinView for provisional runners
  - Update CSV export functions to include new fields
  - Add status indicators in SetupView runner preview
- **Acceptance Criteria**:
  - CSV import supports `is_official_5k` and `is_official_10k` fields
  - Backward compatibility: missing fields default to true (official)
  - Check-in shows popup for provisional runners asking about participation
  - Popup allows race director to promote provisional to official status
  - Setup view displays official/provisional badges for each distance
  - CSV export includes updated status flags
  - Status changes persist to database and carry forward to next race

### 2. **Day-of Registration for New Members**
- **Priority**: High
- **User Story**: "As a race director, I want to add new runners to the starter list on race day, treating them exactly like any other runner from the CSV file."
- **Key Principle**: **New members are just regular runners added to the list - no special treatment needed**
- **Requirements**:
  - Add "New Member" button on the check-in dial pad interface
  - Simple registration form with minimal fields:
    - Full name (required)
    - Race distance: 5K or 10K (required)
  - Assign next available race number starting from 990 (990, 991, 992, etc.)
  - **Default handicap time: 00:00 (immediate start with the gun)**
  - **Treat identically to CSV-imported runners in ALL systems**
- **Technical Implementation**:
  - Add new runner directly to existing `runners` array in race object
  - Use existing check-in, timing, staggered start, and results logic
  - No special flags, separate database methods, or different handling
  - Persist by saving updated race object to database
- **Acceptance Criteria**:
  - New runner can be added during check-in process
  - New runner gets unique number (990+) and appears in total count
  - New runner can be checked in and participates like any other runner
  - New runner appears in staggered start queue (at 00:00 if default)
  - New runner appears in results and exports with their race distance
  - **No distinction between "temporary" and "regular" runners in the UI**

### 3. **Add Reset Local Storage Button**
- **Priority**: Medium
- **Description**: Add reset button to help reset all local stored data for testing purposes
- **User Story**: "As a developer/tester, I want to easily reset all local data so I can test the application from a clean state."
- **Requirements**:
  - Add reset button in Settings view (in Danger Zone section)
  - Clear all IndexedDB data
  - Clear localStorage data
  - Reset application to initial state
  - Require confirmation (similar to existing reset functionality)

### 4. **App Crash Recovery**
- **Priority**: Medium
- **Description**: Ensure app picks up from where it left off after crashes
- **User Story**: "As a race director, if the app crashes during a race, I want it to recover to the exact state when I reopen it."
- **Requirements**:
  - Verify critical race data persistence
  - Test race timer recovery after app restart
  - Ensure runner data and finish times are always saved
  - Test recovery during different race phases (setup, active, finished)
- **Investigation Needed**: Check if current implementation already handles this correctly

## 🔧 Optional Future Enhancements

### Accessibility & Performance Audit
- **Task**: Complete comprehensive accessibility and performance testing
- **Details**: WCAG compliance audit, performance optimization, screen reader testing
- **Priority**: Low (application is already highly accessible)

### Advanced Features (Nice-to-Have)
- Multi-club support and branding customization
- Advanced analytics and reporting dashboard  
- Offline-first PWA capabilities
- Multi-language support

## Current Status
- **Development Server**: http://localhost:5174
- **Production Site**: https://bbr.home.ahmadreza.com
- **Commands**: `npm run dev`, `npm run build`, `npm test`
- **Tests**: All tests passing (115 total)
- **Production Build**: Working with automated AWS deployment

## 📋 Completed Tasks
See [Backlog_done.md](./Backlog_done.md) for full list of completed features and implementations.

---
*🎯 Core application is production-ready! All major features implemented successfully.*