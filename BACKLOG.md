# Project Backlog

## Infrastructure & DevOps

### GitHub Actions Deployment Workflow
- [ ] Create automated CI/CD pipeline for S3 deployment

**Description**: Set up GitHub Actions workflow to automatically build and deploy the Bushrun Race Day PWA to GitHub Pages (https://ahmad2x4.github.io/bushrun-race-day/) whenever code is pushed to the main branch.

**Current State**:
- Manual deployment process (or no automated deployment)
- Need automated build and deploy pipeline for faster iteration
- Want consistent, repeatable deployments

**Requirements**:
1. **GitHub Workflow Configuration**:
   - Workflow file at `.github/workflows/deploy.yml`
   - Trigger on push to main branch
   - Manual trigger option (workflow_dispatch)

2. **Build Process**:
   - Run `npm install` to install dependencies
   - Run `npm run build` to create production build
   - Build artifacts located in `dist/` directory (Vite default)

3. **AWS Deployment**:
   - Use OIDC authentication (no long-lived credentials)
   - Assume AWS IAM role for deployment permissions
   - Deploy to GitHub Pages: `https://ahmad2x4.github.io/bushrun-race-day/`
   - Invalidate CloudFront cache after deployment
   - AWS Region: ap-southeast-2

4. **Required AWS Configuration** (Prerequisites):
   - AWS IAM Role ARN for GitHub Actions (format: `arn:aws:iam::ACCOUNT_ID:role/GitHubDeployRole`)
   - CloudFront Distribution ID
   - S3 bucket already created and configured for static website hosting
   - CloudFront distribution already set up pointing to S3 bucket

**Implementation Steps**:
1. Create `.github/workflows/` directory if it doesn't exist
2. Create `deploy.yml` workflow file with:
   - Build job with Node.js setup
   - AWS credentials configuration using OIDC
   - S3 sync command to upload build files
   - CloudFront invalidation command

**Acceptance Criteria**:
- [ ] Workflow file created at `.github/workflows/deploy.yml`
- [ ] Workflow triggers automatically on push to main branch
- [ ] Manual trigger (workflow_dispatch) works correctly
- [ ] Build step successfully compiles application
- [ ] AWS authentication works using OIDC (role-to-assume)
- [ ] Build artifacts successfully deployed to S3 bucket
- [ ] CloudFront cache invalidation runs after deployment
- [ ] Deployment status visible in GitHub Actions tab
- [ ] Failed deployments provide clear error messages

**Security Considerations**:
- Use OIDC for AWS authentication (no stored credentials)
- IAM role should have minimum required permissions (S3 write, CloudFront invalidate)
- No secrets stored in workflow file
- AWS account ID and sensitive ARNs configured as GitHub repository secrets/variables

**Priority**: High (enables automated deployments and faster iteration)
**Effort**: Small (workflow file creation, requires AWS configuration)
**Dependencies**: AWS infrastructure (S3 bucket, CloudFront, IAM role) must be set up first
**User Impact**: Development team - faster deployment cycle

---

## User Experience Improvements

## Future Features


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