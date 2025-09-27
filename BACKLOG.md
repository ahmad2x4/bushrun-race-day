# Project Backlog

## User Experience Improvements

### Pre-Race Staggered Start View
- [ ] Add pre-race view showing all checked-in runners with their staggered start times
- [ ] Sort runners by start time (earliest first)
- [ ] Make the staggered start list scrollable
- [ ] Highlight runners who need to start at the beginning (0:00 start time)
- [ ] Show this view before race starts, then switch to timers after race begins

**Description**: Currently before race start, users can't see the staggered start order. Need a view that shows:
1. All checked-in runners sorted by start time
2. Clear indication of who starts at 0:00 (beginning starters)
3. Scrollable list to handle many runners
4. Automatic transition to timer view when race starts

**Priority**: High
**Effort**: Medium
**User Impact**: Critical for race organization

### Time Adjustment Enhancement
- [ ] Add tap-and-hold functionality to +/- buttons for faster time adjustment
- [ ] Implement accelerated time changes (5 second increments) when holding buttons after initial delay

**Description**: Currently users need to tap multiple times to adjust start times significantly. Add tap-and-hold with acceleration:
1. Initial tap: +/- 1 second
2. Hold with delay: Switch to +/- 5 seconds every interval
3. Continue until user releases

**Priority**: Medium
**Effort**: Small
**User Impact**: High for users with large time adjustments

---

## Future Features

### General Enhancements
- [ ] Enhanced search functionality for runner lookup
- [ ] Bulk operations for race management
- [ ] Export capabilities for results
- [ ] Offline synchronization improvements

---

## Bug Fixes

### Known Issues
- [ ] (No known critical bugs at this time)

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