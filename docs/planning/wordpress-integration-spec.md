# WordPress Integration Specification

**Document Version:** 1.1
**Last Updated:** December 2025
**Status:** Draft

---

## 1. Overview

This specification details the secure integration of WordPress with the Bushrun Race Day PWA application as the primary data storage mechanism for CSV race files. WordPress Media Library serves as the main repository, with local CSV upload/download available as a fallback option.

### Objectives

- Make WordPress the primary data storage for CSV race files
- Automatically select and load race setup CSVs from WordPress based on race date
- Automatically upload next-race CSVs to WordPress after each race
- Maintain local CSV upload/download as fallback option if WordPress is unavailable
- Ensure graceful fallback to local CSV if WordPress connection fails

### Scope

**In Scope:**
- WordPress Media Library integration via REST API
- Application Password-based authentication
- CSV pull/push operations with metadata
- Hybrid metadata + filename-based CSV matching (for manual uploads)
- Filename parsing and fallback matching strategy
- UI components for WordPress operations
- Error handling and user feedback
- Unit and integration testing
- Documentation and deployment
- Support for both app-uploaded (with metadata) and manually-uploaded (filename-based) CSVs

**Out of Scope:**
- WordPress post/page integration
- Custom WordPress post types (future enhancement)
- Multi-club WordPress management
- Automatic sync scheduling
- WordPress admin dashboard widgets
- Advanced metadata editor UI in WordPress admin (use ACF or REST API)

---

## 2. Requirements

### Functional Requirements

#### FR-1: Auto-Load Race Setup CSV from WordPress (Hybrid Metadata + Filename)
- App automatically identifies the most recent CSV file from the previous month using two methods:
  1. **Primary**: Match by metadata fields `race_month` and `race_year` (CSVs uploaded via app)
  2. **Fallback**: Match by filename pattern `bushrun-next-race-YYYY-MM[-rollover].csv` (manually uploaded CSVs)
- If current race is February, load CSV from November of previous year
- If current race is March, load CSV from February
- If no exact month match, search backward month-by-month until CSV found
- CSV is automatically downloaded and parsed into application
- Works with both app-uploaded CSVs (with metadata) and manually-uploaded CSVs (with proper filename)
- For testing: Setting flag allows manual selection of most recent CSV instead of date-matched selection
- If WordPress fails, fall back to local CSV upload

#### FR-2: Auto-Upload Next-Race CSV to WordPress
- After race completion, next-race CSV is automatically generated and uploaded to WordPress
- Single CSV type: next-race (handles both regular race progression and season-rollover scenarios)
- Metadata indicates if it's a season-rollover upload (via `is_season_rollover` flag)
- Each uploaded file includes metadata: race name, race date, CSV type, is_season_rollover
- User receives confirmation of successful upload in UI
- No matter if  WordPress fails or successful, CSV can be generated locally for manual upload or for history
- If wordpress fails thne user receives error message if upload fails with option to manually upload locally

#### FR-3: Secure Authentication
- WordPress credentials stored in environment variables only
- Support WordPress Application Passwords for API access
- Support Basic Authentication with username and application password
- No credentials hardcoded in source code or config files
- HTTPS required for all WordPress connections

#### FR-4: Graceful Fallback to Local CSV
- App attempts to use WordPress for CSV pull and push operations
- If WordPress connection fails, app gracefully falls back to local CSV upload/download
- Network failures are detected and user is notified of fallback mode
- All core race functionality remains available using local CSV
- Clear UI indication when operating in fallback mode (not using WordPress)

#### FR-5: Error Handling
- Network errors display user-friendly messages with retry option
- Authentication errors display specific messages
- API errors display with details
- CSV validation errors display problematic fields
- All errors allow user to continue using local CSV functions

### Non-Functional Requirements

#### NFR-1: Security
- HTTPS mandatory for WordPress URLs
- Application Passwords preferred over main account password
- No credentials logged or exposed in error messages
- CORS headers validated on WordPress responses
- File uploads validated for CSV MIME type

#### NFR-2: Performance
- CSV auto-download and parse completes within 5 seconds on app startup
- CSV auto-upload completes within 10 seconds after race completion
- No blocking operations - all async with progress indicators
- Timeout handling for slow WordPress connections (fallback to local CSV after 30 second timeout)

#### NFR-3: Compatibility
- Support WordPress 5.6+ (REST API v2)
- Support Firefox, Chrome, Safari, Edge browsers
- Support iOS and Android PWA
- No breaking changes to existing CSV functionality

#### NFR-4: Reliability
- Service handles network timeouts gracefully
- Retry logic for transient failures
- Validation prevents corrupt data uploads
- No data loss if WordPress sync fails

#### NFR-5: Usability
- WordPress integration is transparent to user (automatic load/upload)
- Clear visual indicators of WordPress connection status
- Simple, intuitive fallback to local CSV when WordPress unavailable
- Informative error messages explaining fallback mode and next steps

---

## 3. Architecture & Design

### 3.1 Service Layer Architecture

New service layer in `/src/services/` provides WordPress integration:

```
/src/services/
├── wordpress/
│   ├── WordPressConfig.ts           # Configuration & environment variables
│   ├── WordPressAuthService.ts      # Authentication (Basic Auth)
│   ├── WordPressClient.ts           # HTTP client for WordPress REST API
│   ├── WordPressMediaService.ts     # Media Library operations
│   ├── types.ts                     # TypeScript interfaces
│   └── __tests__/                   # Unit tests
├── csv/
│   ├── CSVSyncService.ts            # CSV sync orchestration
│   └── __tests__/
└── index.ts                         # Service exports
```

### 3.2 Service Responsibilities

#### WordPressConfig
- Load WordPress URL, username, password from environment variables
- Validate configuration (HTTPS requirement, credential presence)
- Determine if WordPress integration is enabled
- Provide configuration to other services

#### WordPressAuthService
- Create Basic Authentication headers
- Encode username and application password in base64
- Test authentication with WordPress API

#### WordPressClient
- Manage HTTP communication with WordPress REST API
- Handle GET requests for listing/fetching resources
- Handle POST requests for file uploads
- Manage Content-Type headers (especially FormData)
- Provide typed error responses
- Automatic request/response logging for debugging

#### WordPressMediaService
- List CSV files in WordPress Media Library
- Download CSV file content
- Upload CSV files with metadata
- Attach custom metadata to uploaded files
- Handle Media Library-specific operations

#### CSVSyncService
- Orchestrate pull operations (download → parse → load)
- Orchestrate push operations (generate → upload → verify)
- Integrate with existing CSV parsing functions
- Provide high-level sync operations for UI components

### 3.3 Component Architecture

#### UI Components

**SetupView** (`/src/components/views/SetupView.tsx`)
- Auto-load CSV from WordPress on view load (based on selected race month)
- Show loading indicator while fetching from WordPress
- Show success message when CSV loaded: "Race data loaded from WordPress"
- Maintain existing drag-drop CSV upload as fallback if WordPress fails
- Show WordPress connection status indicator
- If WordPress fails, prompt user to upload CSV manually
- Settings flag: Option to "Use most recent CSV for testing" (bypasses month matching)

**ExportSection** (`/src/components/race/ExportSection.tsx`)
- Auto-upload next-race CSV to WordPress on race completion
- Show upload status indicator (uploading/success/error)
- Success message: "Race data backed up to WordPress"
- Maintain existing "Download CSV" button for local backup
- If WordPress upload fails, show CSV is available for manual download/upload
- Include note: "Data is also available locally" for transparency

**WordPressStatus** (`/src/components/wordpress/WordPressStatus.tsx`)
- Displays WordPress connection status (connected/disconnected)
- Shows connection indicator in header or race results screen
- Provides visual feedback to user about data sync status
- Clear message if operating in fallback mode (local CSV only)

**RaceResultsView** (modify existing)
- After race completion, auto-trigger upload to WordPress
- Show notification: "Backing up race data to WordPress..."
- Display success/failure status to user

### 3.4 Data Flow

#### Auto-Load Flow (WordPress → App on Startup)
```
App startup - SetupView loads
    ↓
Get current race date from user input
    ↓
Calculate previous month (e.g., if March → search for February CSVs)
    ↓
CSVSyncService.findAndLoadCSVByMonth(previousMonth, previousYear)
    ↓
Step 1: TRY METADATA-BASED MATCHING
    ↓
WordPressMediaService.queryCSVsByMetadata(race_month, race_year)
    ↓
WordPressClient.get('/media') with metadata filter
    ↓
Metadata match found? → YES: Continue to Step 3
    ↓
Metadata match found? → NO: Proceed to Step 2
    ↓
Step 2: FALLBACK TO FILENAME-BASED MATCHING
    ↓
WordPressClient.get('/media') get all CSVs
    ↓
For each CSV filename, extract YYYY-MM using regex pattern
    ↓
Match extracted month/year against target month/year
    ↓
Filename match found? → YES: Use this file, Continue to Step 3
    ↓
Filename match found? → NO: Search backward month-by-month
    ↓
Step 3: DOWNLOAD AND PARSE
    ↓
WordPressMediaService.downloadCSV(selectedMediaId)
    ↓
Fetch content from WordPress media source_url
    ↓
parseCSV(content) → Runner[] (reuse existing logic)
    ↓
Create Race object with parsed runners
    ↓
Save to IndexedDB via db.saveRace()
    ↓
Show success indicator: "Race data loaded from WordPress"
    ↓
If WordPress fails → Fall back to local CSV upload (FR-4)
```

#### Auto-Upload Flow (App → WordPress on Race Completion)
```
Race completion - Results screen shown
    ↓
Generate next-race CSV (reuse existing generateNextRaceCSV)
    ↓
For season rollover, generate with is_season_rollover=true metadata
    ↓
CSVSyncService.uploadNextRaceToWordPress(csvContent, raceMetadata)
    ↓
WordPressMediaService.uploadCSV(file, metadata with is_season_rollover flag)
    ↓
Create FormData with file + custom metadata
    ↓
WordPressClient.post('/media', formData) with Basic Auth
    ↓
WordPress stores file in Media Library with metadata
    ↓
Show success indicator: "Race data backed up to WordPress"
    ↓
CSV also available locally for manual backup
    ↓
If WordPress fails → Generate CSV locally for manual fallback (FR-4)
```

#### Testing Mode Flow (Manual CSV Selection)
```
Settings flag enabled: "Use most recent CSV for testing"
    ↓
App startup
    ↓
CSVSyncService.findMostRecentCSV()
    ↓
WordPressMediaService.listAllCSVsOrderedByDate()
    ↓
Load most recent CSV regardless of month
    ↓
Useful for testing with various race dates/scenarios
```

---

## 4. WordPress REST API Integration

### 4.1 Endpoints Used

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/wp-json/wp/v2/users/me` | GET | Test authentication | Validates credentials |
| `/wp-json/wp/v2/media?mime_type=text/csv` | GET | List CSV files | Filtered by MIME type |
| `/wp-json/wp/v2/media/{id}` | GET | Get file details | Returns source_url |
| `/wp-json/wp/v2/media` | POST | Upload CSV file | With FormData and metadata |
| Source URL (direct fetch) | GET | Download file content | From media item source_url |

### 4.2 Authentication

**Method:** Basic Authentication with WordPress Application Passwords

**Format:**
```
Authorization: Basic base64(username:app_password)
```

**Example:**
```
username: john_doe
app_password: 1a2b 3c4d 5e6f 7g8h 9i0j
→ Authorization: Basic am9obl9kb2U6MWEyYiAzYzRkIDVlNmYgN2c4aCA5aTBq
```

**Security Features:**
- Application Passwords don't expose main account password
- Each app password can be individually revoked
- WordPress tracks which application used which password
- Instant revocation without changing main password
- Requires HTTPS in production

### 4.3 Metadata Structure & Hybrid Approach

The app supports a hybrid approach for handling CSVs from different upload sources:

**Metadata (Optional - For App-Uploaded CSVs)**

Custom metadata attached to each file uploaded by the app:

```json
{
  "race_name": "Bushrun December 2025",
  "race_date": "2025-12-07",
  "race_month": 12,
  "race_year": 2025,
  "csv_type": "next-race",
  "is_season_rollover": false
}
```

**Metadata Fields:**
- `race_name`: Display name of the race
- `race_date`: Full date in ISO format (YYYY-MM-DD)
- `race_month`: Month number (1-12) for auto-selection matching
- `race_year`: Year number for auto-selection matching
- `csv_type`: Always "next-race" for current implementation
- `is_season_rollover`: Boolean flag indicating if season-start CSV (true) or regular progression (false)

**Filename Convention (Fallback - For Manually-Uploaded CSVs)**

When CSVs are uploaded manually to WordPress Media Library without metadata, the app parses filenames:

- **Format**: `bushrun-next-race-YYYY-MM[-rollover].csv`
- **Examples**:
  - `bushrun-next-race-2025-12.csv` → Regular race, December 2025
  - `bushrun-next-race-2026-01-rollover.csv` → Season-rollover, January 2026
  - `bushrun-next-race-2025-02.csv` → Regular race, February 2025

**Hybrid Matching Strategy:**
1. App tries metadata-based matching first (exact match on `race_month` + `race_year`)
2. If no metadata match, app parses all filenames matching pattern for date extraction
3. Both sources provide equal priority - whichever match is found first is used
4. Filename parsing uses regex: `/bushrun-next-race-(\d{4})-(\d{2})(?:-rollover)?\.csv/i`
5. If filename contains "rollover", `is_season_rollover` is set to true

**Auto-Selection Logic (Hybrid Approach):**

When app loads, it searches for CSV using two methods:

1. **Primary: Metadata-based matching** (CSVs uploaded via app or with metadata)
   - Search for CSV where `race_month` matches previous month of current race
   - Race in February → Find most recent "next-race" CSV where `race_month` = 11 (November)
   - Race in March → Find most recent "next-race" CSV where `race_month` = 2 (February)

2. **Fallback: Filename-based matching** (manually uploaded CSVs without metadata)
   - If no metadata match found, parse filenames for date information
   - Supported filename format: `bushrun-next-race-YYYY-MM[-rollover].csv`
   - Examples:
     - `bushrun-next-race-2025-12.csv` → Extract month: 12, year: 2025
     - `bushrun-next-race-2026-01-rollover.csv` → Extract month: 1, year: 2026, is_season_rollover: true
   - Parse all CSV filenames matching pattern and match against previous month

3. **Backward search**: If no exact month match found, search backward month-by-month until CSV located

**Filename Parsing Rules:**
- Format: `bushrun-next-race-YYYY-MM[-rollover].csv` or similar Bushrun pattern
- Extract YYYY (4 digits) as year
- Extract MM (2 digits after hyphen) as month
- If filename contains "rollover", set `is_season_rollover` = true
- Case-insensitive matching

### 4.4 CORS Configuration

WordPress site requires CORS headers for cross-origin requests from PWA domain.

**Option 1: Add to WordPress theme functions.php**
```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://your-pwa-domain.com');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
});
```

**Option 2: Use WordPress CORS plugin**
- Install plugin like "Enable CORS" or "CORS Header"
- Configure allowed origins in plugin settings
- Set allowed methods and headers

---

## 5. Configuration

### 5.1 Environment Variables

Create `.env` file in project root (add to `.gitignore`):

```env
# WordPress Integration Configuration
VITE_WP_URL=https://your-wordpress-site.com
VITE_WP_USERNAME=your-username
VITE_WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

Create `.env.example` for documentation:

```env
# WordPress Integration (Optional)
# Leave empty to disable WordPress integration
VITE_WP_URL=
VITE_WP_USERNAME=
VITE_WP_APP_PASSWORD=
```

**Important:**
- Never commit `.env` file to git (add to `.gitignore`)
- Must include spaces in application password as generated by WordPress
- HTTPS required (http:// will be rejected)
- All three variables required to enable integration

### 5.2 TypeScript Environment Declarations

Create `/src/env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WP_URL: string;
  readonly VITE_WP_USERNAME: string;
  readonly VITE_WP_APP_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 5.3 Build Configuration

No changes required to `vite.config.ts`. Vite automatically:
- Loads environment variables from `.env` files
- Makes `VITE_*` prefixed variables available via `import.meta.env`
- Supports `.env`, `.env.local`, `.env.production`, etc.

### 5.4 CI/CD Configuration

**GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
- name: Build
  env:
    VITE_WP_URL: ${{ secrets.VITE_WP_URL }}
    VITE_WP_USERNAME: ${{ secrets.VITE_WP_USERNAME }}
    VITE_WP_APP_PASSWORD: ${{ secrets.VITE_WP_APP_PASSWORD }}
  run: npm run build
```

**Setup:**
1. Go to GitHub repo Settings → Secrets and variables → Actions
2. Add three new repository secrets with same names as environment variables
3. Values pulled from `.env` file during local development

---

## 6. Error Handling

### 6.1 Error Categories

| Error Type | Cause | User Experience | Recovery |
|------------|-------|-----------------|----------|
| Network Error | Connection timeout, no internet | "Network error. Check your connection." | Retry button |
| Auth Error | Invalid credentials, expired token | "Authentication failed. Check your WordPress credentials." | Settings button |
| API Error | WordPress REST API failure (4xx, 5xx) | "WordPress API error: {status} {reason}" | Retry button |
| Validation Error | Invalid CSV format, missing fields | "CSV validation failed: {field errors}" | Show error details |
| Permission Error | Insufficient WordPress user permissions | "Permission denied. Check WordPress user role." | Documentation link |
| File Error | Can't access file, corrupted data | "Failed to process file. Try again." | Retry or new file |

### 6.2 Error Response Pattern

All service methods return typed response objects:

```typescript
// Success response
{ success: true, data: {...} }

// Error response
{ success: false, error: "User-friendly error message" }
```

### 6.3 User-Friendly Error Messages

**Network Errors:**
- "Network error. Check your internet connection and try again."
- "Request timed out. Check your WordPress URL and try again."

**Authentication Errors:**
- "Invalid WordPress credentials. Check your username and application password."
- "WordPress authentication failed. Application password may have been revoked."

**API Errors:**
- "WordPress is not responding (HTTP 500). Try again later."
- "WordPress API error: 404 - Resource not found"

**Validation Errors:**
- "CSV validation failed: Missing 'full_name' column"
- "CSV validation failed: Invalid handicap time format in row 5"

### 6.4 User Feedback Mechanisms

**Loading States:**
- Spinner animation while fetching from WordPress
- "Loading CSV files..." message
- Disabled buttons during operations

**Success Feedback:**
- Success toast: "CSV uploaded successfully to WordPress"
- Green checkmark icon in UI
- Auto-dismiss after 3 seconds

**Error Feedback:**
- Error toast with red background
- Error icon and clear message
- Actionable buttons (Retry, Check Settings, View Details)
- Error details expandable for technical users

---

## 7. Security

### 7.1 Credential Security

**Storage:**
- Environment variables only (not in config files, cookies, localStorage)
- `.env` file excluded from git via `.gitignore`
- Never logged in error messages or debug output
- Not exposed in browser DevTools or network inspector

**Transport:**
- HTTPS required for all WordPress connections
- Basic Auth headers only sent over HTTPS
- Config validator rejects HTTP URLs
- Certificate validation performed by browser

**Rotation:**
- Users can revoke application passwords in WordPress
- New password required on next application startup
- No password caching or persistence

### 7.2 Data Validation

**Upload Validation:**
- CSV MIME type validation before sending to WordPress
- CSV content validation (required fields, data types)
- File size limits enforced
- Sanitization of metadata fields

**Download Validation:**
- WordPress MIME type validation (must be text/csv)
- CSV content validation after download
- Parser error handling for malformed CSV
- Data type validation on parsed runners

### 7.3 CORS & Origin Security

**Verification:**
- CORS headers validated on all responses
- Only accept responses with correct Access-Control-Allow-Origin
- Credentials sent only if CORS allows
- Browser enforces same-origin policy

**Configuration:**
- WordPress site should restrict CORS to PWA domain
- Avoid overly permissive CORS (no `*` origin)
- Specific methods (GET, POST) restricted

### 7.4 File Upload Security

**Prevention:**
- No file type bypass (MIME type checked)
- No script injection in metadata fields
- Filename sanitization
- File size limits (reasonable CSV size)

**Best Practices:**
- Validate CSV is readable after download
- Don't execute files from WordPress
- Handle malformed data gracefully
- Log security-relevant events (failed auth, etc.)

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Test Coverage:**

| Module | Test File | Test Cases |
|--------|-----------|-----------|
| WordPressConfig | `WordPressConfig.test.ts` | Config loading, validation, HTTPS check |
| WordPressAuthService | `WordPressAuthService.test.ts` | Auth header creation, Basic Auth format |
| WordPressClient | `WordPressClient.test.ts` | GET/POST requests, error handling, timeout |
| WordPressMediaService | `WordPressMediaService.test.ts` | List/upload/download, metadata, MIME filtering |
| CSVSyncService | `CSVSyncService.test.ts` | Pull flow, push flow, CSV integration |

**Mocking Strategy:**
- Mock `fetch` using `vi.fn()` from Vitest
- Mock WordPress API responses with realistic data
- Test both success and error paths
- Test timeout and network failure scenarios

**Example Test:**
```typescript
describe('WordPressClient', () => {
  it('should make authenticated GET requests with Basic Auth header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' })
    });

    const client = new WordPressClient(config);
    await client.get('/media');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/wp-json/wp/v2/media'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /)
        })
      })
    );
  });
});
```

### 8.2 Integration Tests

**Playwright Test Scenarios:**

1. **Pull CSV Flow**
   - Navigate to Setup view
   - Click "Pull from WordPress" button
   - Verify modal displays available CSVs
   - Select CSV and verify it loads
   - Verify race is saved to IndexedDB

2. **Push CSV Flow**
   - Run a race and get results
   - Click "Push Results to WordPress"
   - Verify file uploaded to WordPress Media Library
   - Verify metadata attached correctly
   - Verify success notification shown

3. **Error Handling**
   - Mock WordPress API to return 401 (auth error)
   - Verify user-friendly error message displayed
   - Verify retry button is functional
   - Verify local CSV operations still work

4. **Offline Behavior**
   - Simulate no internet connection
   - Verify WordPress features are disabled/hidden
   - Verify local CSV upload/download still works
   - Restore connection and verify WordPress features return

5. **Configuration**
   - Test with valid credentials → features enabled
   - Test with missing env vars → features disabled
   - Test with HTTP URL → validation error shown
   - Test with invalid credentials → auth error on connection test

### 8.3 Manual Testing Checklist

**Setup Phase:**
- [ ] WordPress site has valid HTTPS certificate
- [ ] Application Password created and documented
- [ ] CORS configured on WordPress site
- [ ] Environment variables set correctly in `.env`
- [ ] PWA application restarted to load new env vars

**Functionality Tests:**
- [ ] "Pull from WordPress" button appears in SetupView
- [ ] Modal lists CSV files with correct metadata displayed
- [ ] Selecting CSV downloads and parses successfully
- [ ] Race loads with correct runner data from WordPress CSV
- [ ] "Push to WordPress" buttons visible in ExportSection
- [ ] Results CSV uploads and appears in WordPress Media Library
- [ ] Next-race CSV uploads successfully
- [ ] Season-rollover CSV uploads successfully
- [ ] Metadata attached to uploaded files (verify in WordPress)

**Error Scenario Tests:**
- [ ] Invalid WordPress URL shows error message
- [ ] Invalid credentials show auth error
- [ ] Network timeout shows connection error with retry
- [ ] Malformed CSV shows validation error
- [ ] WordPress offline - local CSV upload/download still work
- [ ] Missing required fields in CSV - validation error shown

**Security Tests:**
- [ ] HTTPS enforced for WordPress URL
- [ ] Credentials not logged in console
- [ ] Credentials not exposed in network tab
- [ ] Application Password can be revoked in WordPress
- [ ] After revocation, auth fails with clear error

---

## 9. User Documentation

### 9.1 Setup Instructions

**For Users:**

1. **Generate WordPress Application Password**
   - Log in to your WordPress admin dashboard
   - Navigate to Users → Your Profile
   - Scroll to "Application Passwords" section
   - Enter application name: "Bushrun Race Day PWA"
   - Click "Add New Application Password"
   - Copy the generated password (shown only once)
   - Save it securely

2. **Configure Environment Variables**
   - Create `.env` file in the PWA project root:
   ```
   VITE_WP_URL=https://your-wordpress-site.com
   VITE_WP_USERNAME=your-wordpress-username
   VITE_WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
   ```
   - Replace values with your WordPress site URL, username, and app password
   - Keep the spaces in the application password
   - Save the file (it's not committed to git)

3. **Configure WordPress CORS**
   - Add to your WordPress theme's `functions.php` file:
   ```php
   add_action('rest_api_init', function() {
       remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
       add_filter('rest_pre_serve_request', function($value) {
           header('Access-Control-Allow-Origin: https://your-pwa-domain.com');
           header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
           header('Access-Control-Allow-Credentials: true');
           header('Access-Control-Allow-Headers: Authorization, Content-Type');
           return $value;
       });
   });
   ```
   - Or install a CORS plugin like "Enable CORS"
   - Configure it to allow your PWA domain

4. **Test Connection**
   - Restart the PWA
   - In Setup view, when you select a race date, it will automatically attempt to load from WordPress
   - You should see "Loading race data from WordPress..." message
   - If successful, you'll see "Race data loaded from WordPress" confirmation
   - If error, check credentials and WordPress URL

### 9.2 User Guide

**Automatic Race Data Loading:**
1. Open the PWA and go to Setup view
2. Enter the race date (e.g., March 15, 2025)
3. The app automatically searches WordPress for a CSV from the previous month (February)
4. App first searches for CSVs with metadata `race_month=2` and `race_year=2025`
5. If no metadata match found, app searches filenames for `bushrun-next-race-2025-02.csv` pattern
6. If found (by metadata or filename), CSV is automatically downloaded and loaded
7. If not found, app searches backward (January, December, etc.) until a CSV is found
8. If WordPress fails or no CSVs found, local CSV upload appears as fallback
9. Continue with check-in and race as normal

**Manually Uploading CSVs to WordPress:**
1. Go to WordPress Admin → Media → Add New
2. Upload your next-race CSV file
3. **Important: Use filename format** `bushrun-next-race-YYYY-MM.csv`
   - Example: `bushrun-next-race-2025-12.csv` for December 2025
   - Example: `bushrun-next-race-2026-01-rollover.csv` for season-start January 2026
4. The app will automatically detect and match this CSV based on filename
5. Optional: Add metadata via REST API or WordPress plugin for additional validation

**Manual Upload via REST API (For Technical Users):**
```bash
curl -X POST https://your-site.com/wp-json/wp/v2/media \
  -H "Authorization: Basic base64(username:password)" \
  -F "file=@bushrun-next-race-2025-12.csv" \
  -F "title=Bushrun December 2025" \
  -F "meta[race_month]=12" \
  -F "meta[race_year]=2025" \
  -F "meta[csv_type]=next-race" \
  -F "meta[race_name]=Bushrun December 2025" \
  -F "meta[race_date]=2025-12-07" \
  -F "meta[is_season_rollover]=false"
```

**For Testing: Manual CSV Selection**
1. Go to Settings
2. Enable flag: "Use most recent CSV for testing"
3. On next race setup, app will load the most recent CSV regardless of date
4. Useful for testing with various scenarios

**Automatic Race Data Backup:**
1. Complete a race (check-in, finish times, results)
2. After results are calculated, app automatically uploads next-race CSV to WordPress
3. You'll see message: "Backing up race data to WordPress..."
4. When complete: "Race data backed up to WordPress"
5. Data is also available locally via "Download CSV" button for additional backup
6. If WordPress upload fails, you can manually download and upload CSV later

**Troubleshooting:**

*"Race data not loading from WordPress"*
- Check `.env` file has all three WordPress variables set correctly
- Verify WordPress URL uses HTTPS (http:// won't work)
- Restart the PWA application to reload environment variables
- Check WordPress username and application password are correct
- Verify CORS is configured on WordPress site
- **Check filename format**: If manually uploaded, ensure filename is `bushrun-next-race-YYYY-MM.csv`
  - Example: `bushrun-next-race-2025-02.csv` for February 2025
  - Wrong: `bushrun-results.csv` or `my-race-file.csv` (won't be detected)
- If metadata exists, verify `race_month` and `race_year` match expected month
- Check that appropriate CSV files exist in WordPress Media Library
- If still failing, local CSV upload will appear as fallback option

*"CSV found but loading takes too long"*
- Check your internet connection speed
- WordPress response should occur within 30 seconds (timeout limit)
- If timeout, fallback to local CSV upload will automatically trigger
- Check WordPress site performance/responsiveness

*"Backup to WordPress failed"*
- Check WordPress user has permission to upload media
- Verify CORS configuration on WordPress side for POST requests
- Check that next-race CSV was properly generated locally
- Manual backup available: Download CSV locally and upload to WordPress later
- Next race can still proceed with local CSV

*"Testing mode: Can't find most recent CSV"*
- Check that CSV files exist in WordPress Media Library
- Enable "Use most recent CSV for testing" in Settings
- Verify WordPress is properly configured and accessible
- Check that at least one CSV has been uploaded to WordPress

---

## 10. Developer Documentation

### 10.1 Architecture Overview

The WordPress integration follows a layered architecture:

**Presentation Layer** → **Service Layer** → **WordPress REST API**

**Presentation Layer:**
- React components (SetupView, ExportSection, modals)
- Handle user interactions and display
- Call CSVSyncService for WordPress operations

**Service Layer:**
- CSVSyncService: High-level orchestration
- WordPressMediaService: Media Library operations
- WordPressClient: HTTP communication
- WordPressAuthService: Authentication
- WordPressConfig: Configuration management

**External APIs:**
- WordPress REST API v2
- WordPress Media Library endpoint
- Direct file download via source URLs

### 10.2 Integration Points with Existing Code

**CSV Parsing:**
- Reuse existing `parseCSV()` function from `/src/raceLogic.ts`
- Reuse existing `validateRunnerData()` function
- No changes to CSV parsing logic

**CSV Generation:**
- Reuse existing `generateNextRaceCSV()` function for race progression CSV
- Reuse existing `generateSeasonRolloverCSV()` function for season-start CSV
- Both uploaded to WordPress with proper filename: `bushrun-next-race-YYYY-MM[-rollover].csv`
- Both uploaded with metadata flag `is_season_rollover` in REST API call
- Results CSV generation: Not uploaded to WordPress (local storage only)
- No changes to CSV generation logic, only metadata handling for uploads

**Filename Parsing (For Hybrid Approach):**
- Implement utility function to extract date from filename
- Regex pattern: `/bushrun-next-race-(\d{4})-(\d{2})(?:-rollover)?\.csv/i`
- Extract groups: `[1] = year`, `[2] = month`
- Check if filename contains "rollover" to set `is_season_rollover` flag
- Function returns: `{year, month, is_season_rollover, mediaId}`
- Use this when metadata-based matching returns no results

**Data Persistence:**
- Reuse existing IndexedDB DatabaseManager from `/src/db.ts`
- Save pulled race data same way as local CSV
- No changes to database layer

**React Context:**
- Can add WordPressContext (optional) for configuration management
- Or pass services directly to components via props
- Follows existing AppContext/RaceContext pattern

### 10.3 Adding New Features

**Add In-App WordPress Configuration:**
1. Create `/src/components/wordpress/WordPressSettings.tsx`
2. Allow users to input credentials in-app (instead of .env file)
3. Store encrypted in IndexedDB (with encryption library)
4. Load from IndexedDB on app startup if available
5. Validate HTTPS requirement and test connection

**Add Results CSV Upload (Optional Enhancement):**
1. Currently results are NOT uploaded to WordPress
2. If needed in future: Add "Upload Results" button after race completion
3. Use same service layer with `csv_type: "results"` metadata
4. User decision: Upload for historical record keeping

**Add Advanced CSV Filtering:**
1. Filter WordPress CSVs by month/year/race name in metadata
2. Show user list of available CSVs for manual selection (alternative to auto-selection)
3. Add "Select CSV manually" option in Settings
4. Support multi-club CSV management

**Add Race Analytics Dashboard:**
1. Display all uploaded races from WordPress in chronological view
2. Show race statistics and performance trends
3. Filter by date range, club, distance
4. Sync status indicators for each race

### 10.4 Testing New Features

**Unit Test Template:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('NewWordPressFeature', () => {
  beforeEach(() => {
    // Setup mocks
  });

  it('should do something', async () => {
    // Test implementation
  });

  it('should handle errors', async () => {
    // Error handling test
  });
});
```

**Integration Test Template (Playwright):**
```typescript
import { test, expect } from '@playwright/test';

test('should complete WordPress flow', async ({ page }) => {
  await page.goto('/');
  // Test steps
  await expect(page.getByText('Success')).toBeVisible();
});
```

---

## 11. Deployment

### 11.1 Local Development

```bash
# Install dependencies
npm install

# Create .env file with WordPress credentials
cp .env.example .env
# Edit .env with your WordPress URL, username, password

# Start dev server
npm run dev

# Run tests
npm test
```

### 11.2 Production Deployment

**GitHub Pages with GitHub Actions:**

1. **Add Secrets to GitHub:**
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_WP_URL`, `VITE_WP_USERNAME`, `VITE_WP_APP_PASSWORD`

2. **Update Workflow:**
   ```yaml
   - name: Build
     env:
       VITE_WP_URL: ${{ secrets.VITE_WP_URL }}
       VITE_WP_USERNAME: ${{ secrets.VITE_WP_USERNAME }}
       VITE_WP_APP_PASSWORD: ${{ secrets.VITE_WP_APP_PASSWORD }}
     run: npm run build
   ```

3. **Deploy:**
   - Push to main branch
   - GitHub Actions builds with WordPress credentials
   - Built app deployed to GitHub Pages

### 11.3 Version Control

**.gitignore updates:**
```
# Environment variables
.env
.env.local
.env.*.local
```

**No credentials in git:**
- `.env` file excluded
- No hardcoded WordPress URLs
- No API keys in source code

---

## 12. Success Criteria

**Functional Completeness:**
- ✅ App automatically loads race CSV from WordPress based on previous month matching
- ✅ App automatically uploads next-race CSV to WordPress after race completion
- ✅ WordPress is primary storage method for race data
- ✅ Local CSV upload/download available as fallback if WordPress unavailable
- ✅ All error scenarios gracefully fall back to local CSV operations
- ✅ Testing flag allows manual selection of most recent CSV for testing purposes

**Code Quality:**
- ✅ Unit tests pass (>80% coverage for services)
- ✅ Integration tests pass for main workflows
- ✅ No TypeScript errors or linting issues
- ✅ All services properly typed with interfaces
- ✅ No credentials in code or logs

**Security:**
- ✅ HTTPS enforced for WordPress URLs
- ✅ Application Passwords used (not main password)
- ✅ Credentials stored in environment variables only
- ✅ CORS headers validated
- ✅ File uploads validated for MIME type

**User Experience:**
- ✅ Clear error messages guiding users to solutions
- ✅ Loading states with spinners and progress
- ✅ Success/error notifications for operations
- ✅ WordPress status indicator visible to user
- ✅ Intuitive UI for pull/push operations

**Documentation:**
- ✅ README updated with WordPress setup instructions
- ✅ Developer documentation for integration points
- ✅ Troubleshooting guide for common issues
- ✅ Code examples for extending features

---

## 13. Future Enhancements

**Phase 2 Enhancements (Beyond Initial Implementation):**
1. In-app WordPress credential configuration (alternative to .env)
2. Manual CSV selection UI (alternative to auto-selection)
3. Results CSV upload to WordPress (optional historical records)
4. Custom WordPress post types for races (better organization)
5. Multi-club WordPress management (separate blogs/sites)
6. Advanced metadata filtering and search
7. Race analytics and statistics dashboard

**Phase 3 Enhancements (Advanced Features):**
1. Background sync when network restored (persistent queue)
2. Sync conflict resolution (handle duplicate uploads)
3. Multi-device synchronization (same WordPress across devices)
4. WordPress notification webhooks for race updates
5. Real-time race results display on WordPress site
6. CSV versioning and history tracking
7. Automatic backup scheduling to WordPress

---

## 14. Appendix

### A. Example CSV Files

**Input CSV Format:**
```csv
member_number,full_name,is_financial_member,distance,current_handicap_5k
1,"John Smith",true,5km,02:15
2,"Jane Doe",true,10km,
3,"Bob Wilson",false,5km,03:45
```

**Next-Race CSV Format (uploaded to WordPress):**
```csv
member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k
1,"John Smith",true,5km,02:10,
2,"Jane Doe",true,10km,,01:15
3,"Bob Wilson",false,5km,03:45,
```

**Results CSV Format (local storage only, not uploaded):**
```csv
member_number,full_name,distance,finish_position,finish_time,old_handicap,new_handicap
1,"John Smith",5km,1,25:30,02:15,02:10
2,"Jane Doe",10km,3,58:45,,01:15
3,"Bob Wilson",5km,DNF,,03:45,03:45
```

### B. WordPress REST API Response Examples

**List Media Response (Next-Race CSV):**
```json
{
  "id": 123,
  "date": "2025-12-07T10:30:00",
  "title": { "rendered": "bushrun-next-race-december.csv" },
  "source_url": "https://example.com/wp-content/uploads/2025/12/bushrun-next-race-december.csv",
  "mime_type": "text/csv",
  "media_details": {
    "file": "bushrun-next-race-december.csv",
    "filesize": 2048
  },
  "meta": {
    "race_name": "Bushrun December 2025",
    "race_date": "2025-12-07",
    "race_month": 12,
    "race_year": 2025,
    "csv_type": "next-race",
    "is_season_rollover": false
  }
}
```

**List Media Response (Season Rollover CSV):**
```json
{
  "id": 124,
  "date": "2026-01-05T10:30:00",
  "title": { "rendered": "bushrun-next-race-january.csv" },
  "source_url": "https://example.com/wp-content/uploads/2026/01/bushrun-next-race-january.csv",
  "mime_type": "text/csv",
  "media_details": {
    "file": "bushrun-next-race-january.csv",
    "filesize": 2150
  },
  "meta": {
    "race_name": "Bushrun January 2026 - Season Start",
    "race_date": "2026-01-10",
    "race_month": 1,
    "race_year": 2026,
    "csv_type": "next-race",
    "is_season_rollover": true
  }
}
```

### C. Environment Variable Reference

| Variable | Type | Required | Example | Notes |
|----------|------|----------|---------|-------|
| VITE_WP_URL | string | Yes | https://bushrun.com | Must use HTTPS |
| VITE_WP_USERNAME | string | Yes | john_doe | WordPress username |
| VITE_WP_APP_PASSWORD | string | Yes | xxxx xxxx xxxx xxxx | Keep spaces in password |

### D. GitHub Actions Workflow Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_WP_URL: ${{ secrets.VITE_WP_URL }}
          VITE_WP_USERNAME: ${{ secrets.VITE_WP_USERNAME }}
          VITE_WP_APP_PASSWORD: ${{ secrets.VITE_WP_APP_PASSWORD }}
        run: npm run build

      - name: Test
        run: npm test

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### D. Filename Parsing Implementation

**Regex Pattern for CSV Filename Matching:**

```javascript
// Pattern to match: bushrun-next-race-YYYY-MM[-rollover].csv
const filenamePattern = /bushrun-next-race-(\d{4})-(\d{2})(?:-rollover)?\.csv/i;

// Function to extract date info from filename
function parseCSVFilename(filename: string) {
  const match = filename.match(filenamePattern);

  if (!match) {
    return null; // Filename doesn't match pattern
  }

  const year = parseInt(match[1], 10);  // Extract YYYY
  const month = parseInt(match[2], 10); // Extract MM
  const isSeasonRollover = filename.includes('rollover');

  return {
    year,
    month,
    isSeasonRollover,
    filename
  };
}

// Usage in CSVSyncService
async function findAndLoadCSVByMonth(targetMonth: number, targetYear: number) {
  // Step 1: Try metadata-based matching
  let matchedCSV = await this.wordPressMediaService.queryCSVsByMetadata(targetMonth, targetYear);

  if (!matchedCSV) {
    // Step 2: Try filename-based matching
    const allCSVs = await this.wordPressMediaService.listAllCSVs();
    const filenameParsedCSVs = allCSVs
      .map(csv => ({
        ...csv,
        parsedName: parseCSVFilename(csv.title.rendered)
      }))
      .filter(csv => csv.parsedName !== null);

    // Find exact month match
    matchedCSV = filenameParsedCSVs.find(
      csv => csv.parsedName.month === targetMonth && csv.parsedName.year === targetYear
    );

    // If no exact match, search backward month-by-month
    if (!matchedCSV) {
      for (let monthOffset = 1; monthOffset <= 12; monthOffset++) {
        let searchMonth = targetMonth - monthOffset;
        let searchYear = targetYear;

        if (searchMonth < 1) {
          searchMonth += 12;
          searchYear -= 1;
        }

        matchedCSV = filenameParsedCSVs.find(
          csv => csv.parsedName.month === searchMonth && csv.parsedName.year === searchYear
        );

        if (matchedCSV) break;
      }
    }
  }

  return matchedCSV;
}
```

**Test Cases for Filename Parsing:**

```typescript
describe('parseCSVFilename', () => {
  it('should parse regular race filename', () => {
    const result = parseCSVFilename('bushrun-next-race-2025-12.csv');
    expect(result).toEqual({
      year: 2025,
      month: 12,
      isSeasonRollover: false,
      filename: 'bushrun-next-race-2025-12.csv'
    });
  });

  it('should parse season-rollover filename', () => {
    const result = parseCSVFilename('bushrun-next-race-2026-01-rollover.csv');
    expect(result).toEqual({
      year: 2026,
      month: 1,
      isSeasonRollover: true,
      filename: 'bushrun-next-race-2026-01-rollover.csv'
    });
  });

  it('should be case-insensitive', () => {
    const result = parseCSVFilename('BUSHRUN-NEXT-RACE-2025-12.CSV');
    expect(result.year).toBe(2025);
    expect(result.month).toBe(12);
  });

  it('should return null for non-matching filenames', () => {
    expect(parseCSVFilename('bushrun-results.csv')).toBeNull();
    expect(parseCSVFilename('my-race-file.csv')).toBeNull();
    expect(parseCSVFilename('bushrun-next-race.csv')).toBeNull(); // Missing YYYY-MM
  });

  it('should validate month range', () => {
    const validMonths = [
      'bushrun-next-race-2025-01.csv',
      'bushrun-next-race-2025-06.csv',
      'bushrun-next-race-2025-12.csv'
    ];

    validMonths.forEach(filename => {
      expect(parseCSVFilename(filename)).not.toBeNull();
    });
  });
});
```

---

**Document End**

*For questions or clarifications about this specification, refer to the approved implementation plan at `/Users/ahmadreza/.claude/plans/nifty-orbiting-deer.md`*
