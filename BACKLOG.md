# Project Backlog

## User Experience Improvements

### Wake Lock for Mobile PWA
- [ ] Implement Screen Wake Lock API to prevent mobile sleep during race operations
- [ ] Add wake lock management for staggered start queue periods
- [ ] Show user notification when wake lock is active
- [ ] Handle browser compatibility and graceful fallbacks

**Description**: Prevent mobile devices from going to sleep while runners are still in the staggered start queue. Uses the Screen Wake Lock API to keep the screen active during critical race timing periods.

**Technical Implementation**:
1. Acquire wake lock when staggered start queue has pending runners
2. Release wake lock when all runners have started or queue is empty
3. Display subtle UI indicator when wake lock is active
4. Graceful fallback for browsers without wake lock support

**Browser Support**: Chrome/Edge (full), Safari iOS 16.4+ (full), Firefox (limited)

**Priority**: Medium
**Effort**: Small-Medium
**User Impact**: High for race directors using mobile devices

---

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