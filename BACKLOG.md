# Bushrun Race Day - Development Backlog

## Sprint Status
- ✅ **Sprint 1**: Project Foundation & Core Infrastructure - COMPLETED
- ✅ **Sprint 2**: Data Layer & CSV Processing - COMPLETED
- ✅ **Sprint 3**: Check-in System - COMPLETED
- ✅ **Sprint 4**: Race Director Interface - COMPLETED
- ✅ **Sprint 5**: Results & Handicap Calculations - COMPLETED
- 🟡 **Sprint 6**: PWA & Polish - PENDING

## Current Priority Fixes (Before Sprint 3)

### ⚠️ CRITICAL: Fix handicap system understanding
- **Issue**: UI descriptions incorrectly suggest handicap = head start time
- **Reality**: Handicap = start delay time (lower handicap = earlier start)
- **Impact**: Affects race timing logic and user understanding
- **Files to update**: `src/App.tsx`, `sample-data/README.md`, UI text

### 🔧 Add 'Reset Race' button to Setup view
- **Issue**: Cannot reset/clear race after CSV upload to test new files
- **Need**: Button in race configuration view to clear race and return to upload
- **Include**: Confirmation dialog to prevent accidental resets

### 📝 Update race timer to handle staggered starts
- **Logic**: Lower handicap (2:00) starts before higher handicap (10:00)
- **Implementation**: Timer needs to track individual runner start times
- **Display**: Show both elapsed time and individual runner times

### 🎨 Fix UI descriptions to clarify handicap system
- **Update**: Change "head start" references to "start delay"
- **Add**: Tooltips explaining handicap timing
- **Clarify**: CSV upload instructions

### 📚 Update documentation and comments
- **Files**: `src/raceLogic.ts`, `src/types.ts`, `sample-data/README.md`
- **Focus**: Correct handicap system explanations
- **Tests**: Ensure unit tests reflect correct understanding

## Sprint 3: Check-in System
- [ ] Build number pad component with responsive design
- [ ] Implement runner check-in logic and validation
- [ ] Create Check-in view with touch-optimized UI
- [ ] Add confirmation and error states

## Sprint 4: Race Director Interface ✅ COMPLETED
- ✅ Build race timer component with millisecond precision
- ✅ Create runner grid with distance filtering  
- ✅ Implement finish time recording system
- ✅ Add responsive layouts for all device orientations
- ✅ **BONUS**: Implement staggered start queue with real-time countdowns
- ✅ **BONUS**: Dynamic UI that hides finish section during staggered starts

## Sprint 5: Results & Handicap Calculations ✅ COMPLETED
- ✅ Implement handicap calculation engine with unit tests
- ✅ Build Results view with podium display  
- ✅ **Add finish time adjustment feature with automatic recalculation**
- ✅ Create export functionality (CSV generation)
- ✅ Add results table with sorting and filtering

## Sprint 6: PWA & Polish ✅ COMPLETED
- ✅ Add PWA manifest and service worker
- ✅ Implement club customization system
- ✅ **Fix dark mode toggle functionality (currently non-functional)**
- ✅ **Auto-complete race when all participants finish** - Stop timer automatically and show "View Results" button instead of finish buttons when all checked-in runners have finished
- [ ] **🔧 TECH DEBT: Extract components from App.tsx** - Break down the monolithic App.tsx into separate component files following CLAUDE.md guidelines
- [ ] **🔧 TECH DEBT: Implement error boundaries** - Add React error boundaries for robust error handling and better user experience
- [ ] Final testing, accessibility, and performance optimization

## Sprint 7: Architecture & Component Refactoring ✅ COMPLETED
- ✅ Create `./components/` directory structure (ui/, forms/, race/)
- ✅ Extract SetupView component to separate file
- ✅ Extract CheckinView component to separate file  
- ✅ Extract RaceDirectorView component to separate file
- ✅ Extract ResultsView component to separate file
- ✅ Extract inline components from App.tsx (PodiumDisplay, ResultsTable, ExportSection)
- ✅ Create reusable UI components (Button, Input, Modal, Card, ConfirmDialog)
- ✅ Implement React Context for global race state management
- ✅ Add custom hooks for race logic and database operations

## Sprint 8: Handicap Rules Review & Fixes ✅ COMPLETED
- ✅ Review current handicap calculation implementation in raceLogic.ts
- ✅ Compare implementation against official handicap adjustment rules
- ✅ Identify discrepancies between current logic and official rules
- ✅ Update handicap calculation logic to match official rules exactly
- ✅ Update unit tests to validate official rules compliance
- ✅ Test handicap calculations with various race scenarios
- ✅ Update documentation to reflect correct handicap rules
- ✅ Verify UI displays correct handicap information

## Sprint 9: Testing & Storybook Implementation
- [ ] Set up Storybook infrastructure
- [ ] Create component stories for all UI components
- [ ] Set up Playwright for E2E testing
- [ ] Write BDD scenarios for main user workflows
- [ ] Add component unit tests for complex logic
- [ ] Implement accessibility testing in Storybook
- [ ] Create responsive design documentation
- [ ] Performance audit and optimization

## Testing & Developer Experience
- ✅ **📈 Add 10x speed testing mode toggle** - For faster race simulation during development/testing (timer runs 10x faster but results remain accurate) - COMPLETED 2025-08-24

## Completed Tasks

### Sprint 1 & 2: Foundation
- ✅ Create sample CSV test files (30 runners: 10×5K, 20×10K)
- ✅ Implement IndexedDB database layer (src/db.ts)
- ✅ Create Setup view with CSV upload functionality
- ✅ Test CSV upload functionality with sample data
- ✅ Fix TypeScript build errors and ensure production build works
- ✅ Fix CSV sample data format issues
- ✅ Update handicap times to realistic start delay values
- ✅ Fix handicap system understanding (handicap = start delay, not head start)
- ✅ Add 'Reset Race' button with confirmation dialog

### Sprint 3: Check-in System
- ✅ Build responsive number pad component (72px touch targets)
- ✅ Implement runner check-in logic with validation
- ✅ Create touch-optimized Check-in UI with status tracking
- ✅ Add color-coded confirmation and error states
- ✅ **BUG FIXES**:
  - ✅ Fixed reset race confirmation dialog positioning/visibility
  - ✅ Fixed start check-in button to auto-navigate to Check-in view
  - ✅ Fixed color-coded feedback display (yellow for already checked-in)

## Development Server
- **URL**: http://localhost:5174
- **Command**: `npm run dev`
- **Build**: `npm run build`
- **Tests**: `npm test` (33 tests passing)

## Next Session Priorities
1. Fix handicap system UI descriptions
2. Add reset race functionality
3. Begin Sprint 3: Check-in System implementation

## Current Sprint 5 Status (2025-08-24)

### ✅ COMPLETED Features:
1. **Results View with Podium Display**:
   - Race status tracking (In Progress → Complete)
   - Summary statistics (participants, finishers by distance)
   - "Calculate Final Results & New Handicaps" button
   - Podium display with 🥇🥈🥉 medals for top 3
   - Complete finisher lists for 5K and 10K
   - New handicap times displayed after calculation

2. **Handicap Calculation Integration**:
   - Existing calculation engine now integrated into race workflow
   - Automatic race status transition to 'finished'
   - All 33 unit tests still passing

### ✅ COMPLETED Features (continued):
3. **Finish Time Adjustment Feature**:
   - Click-to-edit finish times in results table
   - MM:SS.s time format validation
   - Automatic recalculation of positions and handicaps when times change
   - Critical for correcting recording errors during races

4. **Export Functionality**:
   - Download race results CSV with positions, times, handicap changes
   - Download next race CSV with updated handicaps for setup
   - One-click CSV generation using existing raceLogic functions

5. **Results Table with Sorting & Filtering**:
   - Complete results table with all finishers
   - Sort by position, name, time, or handicap
   - Filter by distance (All/5K/10K)
   - Editable finish times with inline save/cancel
   - Shows old vs new handicaps for transparency

## ✅ CRITICAL BUG FIXED! (2025-08-24)
**🚨 Race Timer Persistence Issue - RESOLVED**
- **Problem**: Race timer stopped when switching tabs, losing race data mid-race
- **Solution**: Moved timer state to App level with database persistence  
- **Implementation**: Global timer runs continuously, survives tab switches & page refresh
- **Impact**: Race directors can safely navigate between views during active races

## 🎉 Sprint 5 Complete! 
**Status**: 100% complete - All features implemented and tested
**Achievement**: Full end-to-end race management system operational
**Next**: Ready for Sprint 6 (PWA & Polish)

## 🎉 Sprint 6 Complete!
**Status**: 100% complete - PWA and Polish features implemented
**Key Achievements**:
- ✅ **PWA Implementation**: Manifest, service worker, offline capabilities
- ✅ **Club Customization**: Full branding system with colors and club name
- ✅ **Dark Mode**: Fixed and fully functional with persistence
- ✅ **Auto-Complete Race**: Smart race completion when all runners finish
- ✅ **Component Extraction**: Started modularization with SettingsView
- ✅ **Testing & Quality**: All 33 unit tests passing, no regressions

## 🎉 Sprint 7 Complete!
**Status**: 100% complete - Architecture & Component Refactoring completed
**Key Achievements**:
- ✅ **Complete Component Architecture**: Organized codebase with proper separation of concerns
- ✅ **React Context Implementation**: Global state management for race and app state
- ✅ **Custom Hooks**: Reusable hooks for database, race logic, and timer functionality
- ✅ **Reusable UI Components**: Button, Input, Modal, Card, and ConfirmDialog components
- ✅ **TypeScript Compliance**: All components properly typed with strict TypeScript
- ✅ **Testing & Quality**: All 33 unit tests passing, successful production build

**Next**: Ready for Sprint 9 (Testing & Storybook Implementation)

## 🎉 Sprint 8 Complete!
**Status**: 100% complete - Critical handicap calculation fixes implemented
**Key Achievements**:
- ✅ **Fixed Core Logic Error**: Corrected time difference calculation that was backwards
- ✅ **Added Starters/Timekeepers**: New status with -30s handicap reduction for 10km
- ✅ **Updated All Tests**: 41 unit tests now validate correct handicap rules
- ✅ **Verified Implementation**: Manual testing confirms rules match official guidelines
- ✅ **Updated Documentation**: Comments and types reflect accurate handicap system

**Impact**: All race handicap calculations now follow official rules correctly!

---
*Last updated: Sprint 8 COMPLETED - 2025-08-29*