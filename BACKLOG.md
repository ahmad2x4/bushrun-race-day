# Project Backlog

## User Experience Improvements

## Future Features

### Cross-Distance Handicap Calculations
- [ ] Implement cross-distance handicap calculations for unofficial entries

**Description**: Allow runners who have a handicap for one distance (5k or 10k) but not the other to participate in the other distance with a calculated handicap. The calculated time should be marked as unofficial and the runner should be informed that this is a calculated estimate.

**Use Cases**:
1. Runner has 5k handicap but wants to do 10k on race day
2. Runner has 10k handicap but wants to do 5k on race day

**Conversion Formulas** (based on provided Excel formulas):
- **10k → 5k conversion**: `=IF(ISBLANK($A4),0,MROUND(5/6*1/24-(1/24-VLOOKUP($A4,Data_10km,6,FALSE))/2.1,"0:00:15"))`
- **5k → 10k conversion**: `=IFERROR(IF(ISBLANK($A4),0,MROUND(1/24-(5/6*1/24-VLOOKUP($A4,Data_5km,6,FALSE))*2.1,"0:00:15")),0)`

**Technical Implementation Requirements**:
1. Add conversion functions to `raceLogic.ts` implementing the 5/6 ratio and 2.1 conversion factor
2. Round results to nearest 15 seconds (MROUND equivalent)
3. Handle blank/missing handicaps gracefully
4. Extend Runner interface to support calculated handicaps with unofficial flag
5. Update UI to indicate calculated/unofficial handicap status
6. Add race director approval/modification capability for calculated handicaps
7. Provide clear messaging to runners about unofficial status
8. Include option to convert calculated handicap to official after race completion

**Acceptance Criteria**:
- [ ] Conversion functions accurately implement provided Excel formulas
- [ ] UI clearly distinguishes between official and calculated handicaps
- [ ] Race directors can review and modify calculated handicaps before race start
- [ ] Runners receive clear notification about unofficial handicap status
- [ ] Results properly label unofficial entries
- [ ] Post-race option to promote calculated handicaps to official status

**Priority**: Medium (enhances race day flexibility)
**Effort**: Medium (involves formula implementation, UI updates, and data model changes)
**Dependencies**: Current handicap calculation system in `raceLogic.ts`

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