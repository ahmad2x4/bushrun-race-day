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

### Race Day New Member Registration
- [ ] Add "New" button on check-in view for registering new members on race day
- [ ] Implement temporary member number assignment (starting from 999, decreasing)
- [ ] Auto-check-in new members after registration
- [ ] Display assigned temp number to new member
- [ ] Include temporary members in CSV exports

**Description**: Allow race directors to register new members on race day who are trying the club for the first time. These new members need temporary member numbers and immediate check-in to participate in the race.

**User Story**:
"As a race director, when someone shows up on race day who isn't a member yet, I need to quickly register them with a temporary number so they can participate. They need to know their temp number to tell the timekeeper at the finish line."

**Current Gap**:
- No way to register runners who aren't in the pre-loaded CSV
- New runners showing up on race day cannot participate
- Manual workarounds required for temporary registrations

**Proposed Solution**:

1. **UI Enhancement - Check-in View**:
   - Add "New" button on the number pad (opposite side from "Find Runner")
   - Same styling as "Find Runner" button (blue, prominent)
   - Opens registration dialog when clicked

2. **New Member Registration Dialog**:
   - Simple modal/popup with single name input field
   - "Cancel" and "Register" buttons
   - Minimal friction for quick race-day registration

3. **Temporary Number Assignment**:
   - Start at 999 and decrement for each new member (999, 998, 997...)
   - Track next available temp number in race data
   - Prevent conflicts with regular member numbers

4. **Auto Check-in**:
   - New members are automatically checked in upon registration
   - Default distance: 5km
   - Default handicap: 00:00 (no start delay)
   - Marked as non-official (provisional)

5. **Success Confirmation**:
   - Show modal with runner's assigned temp number (large, prominent)
   - Message: "Your number is XXX - tell this to the timekeeper at the finish"
   - Confirmation that they've been checked in

**Data Structure Changes**:

**Race Interface** (src/types.ts):
```typescript
interface Race {
  // ... existing fields
  next_temp_number: number  // NEW: track next available temp number (starts at 999)
}
```

**No changes needed to Runner interface** - temporary members are identified by:
- `member_number >= 900` (temp number range)
- `is_official_5k: false` AND `is_official_10k: false`

**New Runner Defaults**:
- `member_number`: race.next_temp_number (999, 998, 997...)
- `full_name`: user-entered name
- `is_financial_member: false`
- `distance: '5km'`
- `current_handicap_5k: '00:00'`
- `current_handicap_10k: '00:00'`
- `checked_in: true` (auto check-in)
- `is_official_5k: false` (provisional)
- `is_official_10k: false` (provisional)

**Export Behavior**:
- Temporary members included in both CSV exports (results and next race)
- No special distinction needed (handled as provisional runners)
- Can be promoted to regular members in future races

**Implementation Plan**:

**Phase 1: Data Structure** (src/types.ts)
- Add `next_temp_number: number` to Race interface (default: 999)
- No changes needed to Runner interface

**Phase 2: Dialog Component** (src/components/forms/NewMemberDialog.tsx)
- Create new modal component
- Single name input field
- Form validation (non-empty name)
- Success screen showing assigned temp number

**Phase 3: Check-in View Integration** (src/components/views/CheckinView.tsx)
- Add "New" button to number pad area
- Add dialog visibility state
- Wire up button to open dialog
- Handle registration submission:
  - Create new Runner object with temp number
  - Add to race.runners array
  - Decrement race.next_temp_number
  - Save to database
  - Show success with temp number

**Phase 4: Race Initialization** (race setup/creation logic)
- Initialize `next_temp_number: 999` when creating new races
- Add migration/default for existing races

**Files to Create/Modify**:
1. `src/types.ts` - Add new fields to interfaces
2. `src/components/forms/NewMemberDialog.tsx` - NEW component
3. `src/components/views/CheckinView.tsx` - Add button and integration
4. Race initialization logic - Set next_temp_number default

**UI/UX Requirements**:
- Quick and easy registration (minimal fields)
- Add storybook story for the new dialog as sample 
- Clear display of assigned temp number
- Accessible button placement on check-in screen
- Confirmation that runner is checked in
- Mobile-friendly dialog design

**Acceptance Criteria**:
- [ ] "New" button appears on check-in view number pad
- [ ] Clicking "New" opens registration dialog
- [ ] Name field is required and validated
- [ ] First new member gets number 999, second gets 998, etc.
- [ ] New member is automatically checked in with 5km/00:00 defaults
- [ ] Success screen prominently displays assigned temp number
- [ ] Temporary members appear in runner lists (marked as provisional)
- [ ] CSV exports include temporary members
- [ ] Temp numbers don't conflict with regular member numbers
- [ ] Works on mobile devices used during race day

**Edge Cases to Handle**:
- Empty name field (show validation error)
- Multiple new members registered in quick succession (proper number tracking)
- Temp number reaches low limit (e.g., below 900) - what happens?
- Race data persistence across app restarts
- Temporary members showing in various race views

**Testing Requirements**:
- Unit tests for temp number assignment logic
- Component tests for NewMemberDialog
- E2E test for complete registration flow
- CSV export validation with temp members
- Mobile device testing

**Priority**: Medium (Nice-to-have for race day operations)
**Effort**: Small-Medium (new dialog component + check-in integration)
**User Impact**: Medium (helps with occasional new runner registrations)
**Dependencies**: Current check-in system, Runner/Race data structures

**Notes**:
- Temporary members are identified by: `member_number >= 900` AND `is_official_5k: false` AND `is_official_10k: false`
- No new Runner interface field needed - existing fields are sufficient
- Temporary members are treated as provisional (can't get podium)
- They start with 00:00 handicap (no start delay)
- Can be promoted to regular members in future races (update member number and official status)
- Typically only 2-3 new members per race day
- Registration must be quick (race day time pressure)
- CSV structure remains unchanged - no new columns

---

### UI/UX Improvements

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