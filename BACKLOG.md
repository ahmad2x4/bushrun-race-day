# Project Backlog

## Infrastructure & DevOps

### ✅ GitHub Pages Deployment with Semantic Versioning
- [x] Create automated CI/CD pipeline for GitHub Pages deployment
- [x] Implement semantic versioning system
- [x] Add automatic changelog generation
- [x] Create GitHub Releases with each deployment

**Status**: ✅ **COMPLETED**

**Description**: Automated deployment pipeline to GitHub Pages with semantic versioning and changelog generation.

**Implementation**:
- Workflow file at `.github/workflows/static.yml`
- Automatically triggers on push to main branch
- Manual trigger available via workflow_dispatch
- Semantic versioning with auto-patch bump
- Automatic tag creation and GitHub Releases
- Full changelog generation from commit history

**Live URL**: https://ahmad2x4.github.io/bushrun-race-day/

---

## User Experience Improvements

## Future Features

---

### UI/UX Improvements

#### ✅ Mobile Optimization for Check-in View
- [x] Optimize vertical space usage on mobile devices for check-in screen
- [x] Move "Runner Check-in" title to app header bar
- [x] Reduce progress bar size and show only checked-in count (not total/percentage)
- [x] Reduce spacing and padding throughout the view
- [x] Ensure entire number pad is visible on standard mobile screens without scrolling

**Status**: ✅ **COMPLETED**

**Description**: The check-in view was using excessive vertical space (~1000px+) which caused scrolling issues on mobile devices (typically 844px viewport height). Most of the number pad was hidden below the fold, requiring constant scrolling during race day operations.

**User Story**:
"As a race volunteer doing check-ins on my phone, I need to see the entire number pad and 'Find Runner' button without scrolling so I can quickly check in runners during the busy pre-race period."

**Current Issues**:
- Page title "Runner Check-in" takes up ~70px with large font and excessive margin
- Progress bar showing "0 of 147 runners checked in - 0%" takes up ~104px
- Multiple padding/margin layers consume 150+ pixels
- Number pad and action button extend below viewport, requiring scrolling
- Total vertical space needed exceeds typical mobile screen height by 200px+

**Proposed Improvements**:

1. **Move Title to App Header**:
   - Remove standalone h2 "Runner Check-in" title from page body
   - Add it to the app header bar (currently shows "Berowra Bushrunners")
   - This saves ~70px of vertical space

2. **Compact Progress/Status Bar**:
   - Remove "X of total" and percentage display
   - Show only: Race name + checked-in count in single compact line
   - Example: "Bushrun 16/11/2025 • 5 checked in"
   - Reduce padding from p-4 to p-2 or p-3
   - Reduce bottom margin from mb-6 to mb-3 or mb-4
   - Target: reduce from ~104px to ~50-60px

3. **Reduce Page Padding**:
   - Main content: Change py-6 to py-3 or py-4 on mobile (save 24-48px)
   - Number pad wrapper: Change p-6 to p-4 on mobile (save 16px)
   - Member input card: Optimize padding

4. **Tighten Button Spacing**:
   - Reduce gap between number buttons slightly (gap-3 → gap-2)
   - Keep touch target size (72px) but reduce visual spacing
   - Save ~12-18px total

5. **Responsive Classes**:
   - Use Tailwind responsive classes (sm:, md:) to apply tighter spacing only on mobile
   - Keep current spacious layout on tablets/desktop

**Space Savings Calculation**:

| Optimization | Current | Optimized | Savings |
|--------------|---------|-----------|---------|
| Page title | 70px | 0px (moved to header) | 70px |
| Progress bar | 104px | 55px | 49px |
| Main padding (vertical) | 48px | 24px | 24px |
| NumberPad padding | 48px (top+bottom) | 32px | 16px |
| Button gaps | ~36px | ~24px | 12px |
| Title/input margins | ~44px | ~28px | 16px |
| **Total Savings** | | | **~187px** |
| **New Total Height** | ~1000px | **~813px** | **Fits on screen!** |

**Implementation Plan**:

**Phase 1: Move Title to Header** (src/App.tsx)
- Modify app header to show current view name
- Add logic to display "Runner Check-in" when on check-in view
- Could show race name in subtitle or breadcrumb

**Phase 2: Compact Progress Bar** (src/components/views/CheckinView.tsx, lines 238-251)
- Simplify to single line: `{raceName} • {checkedInCount} checked in`
- Change padding: `p-4` → `p-2 sm:p-3`
- Change margin: `mb-6` → `mb-3 sm:mb-4`
- Keep color scheme but make more compact

**Phase 3: Reduce Main Padding** (src/App.tsx, line 502)
- Change `py-6` → `py-3 sm:py-4 md:py-6`
- Reduces top/bottom padding on mobile only

**Phase 4: Optimize NumberPad** (src/components/ui/NumberPad.tsx)
- Change wrapper padding: `p-6` → `p-4 sm:p-5 md:p-6`
- Change button gaps: `gap-3` → `gap-2 sm:gap-3`
- Keep btn-touch-lg size (72px) for accessibility

**Phase 5: Tighten Input Section** (src/components/views/CheckinView.tsx)
- Reduce margins on input card
- Optimize label/input spacing
- Consider making label smaller or less prominent

**Files to Modify**:
1. `src/App.tsx` - Add view title to header, reduce main padding
2. `src/components/views/CheckinView.tsx` - Remove h2 title, compact progress bar, tighten spacing
3. `src/components/ui/NumberPad.tsx` - Reduce padding and gaps on mobile
4. Potentially: Create reusable mobile-optimized spacing utilities

**UI/UX Requirements**:
- Entire number pad + action button visible without scrolling on iPhone 12/13/14 (844px)
- Maintain 44px minimum touch targets for accessibility
- Responsive design: tighter on mobile, spacious on tablet/desktop
- Dark mode support maintained
- Smooth visual hierarchy despite reduced spacing
- Quick scanning during busy check-in periods

**Acceptance Criteria**:
- [ ] Complete number pad visible on mobile screens (390x844px) without scrolling
- [ ] "Runner Check-in" title appears in app header instead of page body
- [ ] Progress bar shows only: race name + checked-in count (compact, single line)
- [ ] Vertical space reduced by at least 150px on mobile
- [ ] Touch targets remain 44px minimum (accessibility)
- [ ] Desktop/tablet layout maintains comfortable spacing
- [ ] Dark mode styling preserved
- [ ] No layout shift or jank during check-in process
- [ ] Works on common mobile devices (iPhone 12-15, Android equivalents)

**Testing Requirements**:
- Visual regression tests for mobile viewport (390x844px)
- Test on real devices (iOS and Android)
- Accessibility audit (touch target sizes)
- Dark mode verification
- Responsive breakpoints testing (mobile, tablet, desktop)

**Priority**: High (Critical for mobile race day check-in operations)
**Effort**: Small-Medium (mostly CSS/Tailwind class changes, some layout restructuring)
**User Impact**: High (enables efficient mobile check-in workflow)
**Dependencies**: Current CheckinView, NumberPad, App header structure

**Implementation Summary**:

Successfully optimized check-in view for mobile screens with ~187px vertical space savings:

1. **Header Integration** (src/App.tsx):
   - Added view subtitle to app header showing "Runner Check-in" when on check-in view
   - Reduced main content padding: `py-6` → `py-3 sm:py-4 md:py-6`

2. **Compact Progress Bar** (src/components/views/CheckinView.tsx):
   - Removed h2 page title (moved to header)
   - Simplified status bar to single centered line: "Race name • X checked in"
   - Removed "of total" count and percentage display
   - Reduced padding: `p-4` → `p-2 sm:p-3`
   - Reduced margin: `mb-6` → `mb-3 sm:mb-4`

3. **NumberPad Optimization** (src/components/ui/NumberPad.tsx):
   - Reduced wrapper padding: `p-6` → `p-4 sm:p-5 md:p-6`
   - Tightened button gaps: `gap-3` → `gap-2 sm:gap-3`
   - Reduced grid margins: `mb-4` → `mb-3 sm:mb-4`

4. **Input Section** (src/components/views/CheckinView.tsx):
   - Reduced card padding: `p-6` → `p-4 sm:p-5 md:p-6`
   - Reduced margins: `mb-6` → `mb-4 sm:mb-5 md:mb-6`

**Results**:
- Total height reduced from ~1000px to ~813px
- Entire number pad now visible on iPhone 12-15 (844px viewport)
- Maintains 72px touch targets for accessibility
- Responsive classes preserve spacious layout on desktop/tablet
- Dark mode support maintained
- Zero linting errors
- Build successful

**Commit**: `e7dd4a5` - feat: optimize check-in view for mobile screens

---

#### Race Director UI Optimization for Active Race State
- [ ] Implement simplified layout during active race to focus on critical information

**Description**: Optimize the Race Director page layout when the race is active to focus attention on the most critical information - the upcoming starters and their timing. Remove unnecessary elements and emphasize the next starter information.

**Current Issues**:
- Too many UI elements compete for attention during active race
- Timer is prominently displayed in a large card when it could be more compact
- Next starter information doesn't have enough emphasis
- Screen space is not optimally used during the critical race period

**Proposed Improvements**:
1. **Simplified Layout During Active Race**:
   - Remove or minimize non-essential elements once race starts
   - Focus the layout on the staggered start queue
   - Create more breathing room on screen

2. **Compact Timer Design**:
   - Move timer to top of page in a smaller, compact format
   - Remove the card wrapper to save space
   - Keep it visible but not dominating the layout

3. **Enhanced Next Starter Display**:
   - Move the next starter card to the top position
   - Increase font size for runner names to improve readability
   - Emphasize the start time for the upcoming runners
   - Make this the primary focal point of the interface

**Benefits**:
- Better focus during critical race periods
- Improved readability of essential information
- More efficient use of screen real estate
- Enhanced user experience for race directors
- Reduced cognitive load during race management

**UI/UX Requirements**:
- Responsive design that works on tablets and mobile devices
- Clear visual hierarchy with next starter as primary focus
- Maintain accessibility standards with larger text
- Smooth transitions between pre-race and active race layouts
- Easy to scan information at a glance

**Implementation Notes**:
- Consider creating different layout states: 'setup', 'pre-race', 'active-race', 'finished'
- May need conditional rendering based on race status
- Could implement as a "focus mode" toggle option
- Test with actual race directors for usability

**Acceptance Criteria**:
- [ ] Layout automatically adapts when race state changes to active
- [ ] Timer moves to compact format at top of page during active race
- [ ] Next starter card becomes primary focal point with enhanced visibility
- [ ] Non-essential UI elements are minimized or hidden during active race
- [ ] Responsive design works on tablets and mobile devices used by race directors
- [ ] Font sizes for runner names and start times are optimized for quick scanning
- [ ] Smooth transitions between different race states
- [ ] Optional "focus mode" toggle for race directors
- [ ] User testing with actual race directors validates improved usability

**Priority**: Medium-High (improves critical race day functionality)
**Effort**: Medium (involves conditional rendering, responsive design, and state management)
**User Impact**: High for race directors during active race periods
**Dependencies**: Current race state management and timer implementation

---

### General Enhancements
- [ ] Enhanced search functionality for runner lookup
- [ ] Bulk operations for race management
- [ ] Export capabilities for results
- [ ] Offline synchronization improvements

---

## Bug Fixes

### Known Issues

#### **HIGH PRIORITY** - Inconsistent beep sound during staggered start
- [ ] Fix audio playback inconsistency in staggered start sequence

**Description**: During race day testing, the beep sound that signals when runners should start was playing for some runners but not for others during the staggered start sequence. This is a critical race day functionality issue.

**Impact**:
- **HIGH PRIORITY** - affects core race timing functionality
- Runners may miss their start signal without the audio cue
- Could cause confusion and timing issues during actual races
- Inconsistent user experience for race directors

**Observed Behavior**:
- Some runners get the beep sound as expected
- Other runners do not get any beep sound
- Issue occurs specifically during staggered start sequence

**Expected Behavior**:
- All runners should receive a beep sound when it's their time to start
- Consistent audio feedback for all start signals

**Investigation Areas**:
1. Check audio playback logic in staggered start implementation
2. Verify browser audio permissions and autoplay policies
3. Look for race conditions or timing issues in beep triggering
4. Test audio context state management
5. Check for any conditional logic that might skip beep for certain runners

**Acceptance Criteria**:
- [ ] All runners receive beep sound when their start time arrives
- [ ] Audio playback is consistent across all browsers and devices
- [ ] No race conditions or timing issues in beep triggering
- [ ] Proper error handling for audio playback failures
- [ ] Race director receives feedback if audio cannot play

**Priority**: High (Critical for race day operations)
**Effort**: Medium (requires audio system investigation and testing)
**Testing Requirements**: Test across multiple browsers and devices with race day simulation

---

## Technical Improvements

### Performance
- [ ] Optimize large dataset handling
- [ ] Improve app startup time
- [ ] Database query optimization

### Code Quality
- [ ] Add more comprehensive error handling
- [ ] Increase test coverage
- [ ] Improve TypeScript strict mode compliance

---

*This backlog is maintained to track feature requests, improvements, and technical debt.*