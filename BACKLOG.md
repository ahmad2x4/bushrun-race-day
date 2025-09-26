# Bushrun Race Day - Development Backlog

## 🎉 Major Development Complete!

All core features and infrastructure have been successfully implemented and are production-ready.

## 🚧 Active Development Items

### 1. **Day-of Registration for New Members**
- **Priority**: High
- **User Story**: "As a race director, I want to register new members who show up on race day, so that everyone can participate even if they're not in the original CSV file."
- **Requirements**:
  - Add "New Member" button on the registration dial pad interface
  - Assign temporary race numbers starting at 990 (990, 991, 992, etc.)
  - Collect new member information:
    - Full name
    - Race selection (5K or 10K)
    - Default start time: 0 (no handicap delay)
    - Optional: Allow manual start time adjustment with +/- controls
  - Store new members in local database alongside CSV-imported runners
  - Ensure new members appear in all race management interfaces
- **Technical Considerations**:
  - Extend database schema to handle dynamically added runners
  - Update check-in, race director, and results views to include new members
  - Maintain data persistence across app restarts
- **Acceptance Criteria**:
  - New members can be registered during check-in process
  - New members receive unique temporary numbers (990+)
  - New members can be checked in and participate in race
  - New members appear in results with their chosen race distance

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