# Bushrun Race Day - Development Backlog

## 🎉 Major Development Complete!

All core features and infrastructure have been successfully implemented and are production-ready.

## 🚧 Active Development Items

### 1. **✅ Start Delay Time Adjustment on Check-in** (COMPLETED)
- **Priority**: High (Top Priority) - **COMPLETED**
- **User Story**: "As a runner during check-in, I want to be able to adjust my start delay time by ±5 seconds using +/- buttons so I can fine-tune my handicap if needed."
- **Implementation Summary**:
  - ✅ Added +/- buttons flanking the start delay time display
  - ✅ Buttons adjust time by exactly ±5 seconds with immediate UI feedback
  - ✅ Time cannot go below 0:00 (minimum constraint implemented)
  - ✅ Changes persist to database immediately via existing db.saveRace() method
  - ✅ Works for both 5km and 10km distances
  - ✅ **CONFIGURABLE SETTING**: Added toggle in Settings to enable/disable feature
  - ✅ Default: Enabled (can be turned off in club settings)
  - ✅ Helper functions for time conversion (mm:ss ↔ seconds)
  - ✅ Comprehensive test coverage (9 new unit tests)
  - ✅ All existing tests passing (115 total)
  - ✅ Production build successful
- **Settings Location**: ⚙️ Settings → Runner Time Adjustment toggle

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

### 2. Add reset local storage button
This reset button helps to reset all the local stored data.
This is great for testing purposes.

### 3. Make sure if app crashes after running again app picks up from where it left off.
This means we need to make sure the critical data is always in the safe storage and they can be calcualted from it. We may already have it however we need to check

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
- **Tests**: All tests passing (106 total)
- **Production Build**: Working with automated AWS deployment

---
*🎯 Core application is production-ready! All major features implemented successfully.*