# Changelog - Second Brain

## [2026-01-25] - Recent Memories Page Addition

### Added
- **Frontend - Recent Memories Page**:
  - New route `/recent` with dedicated page component
  - Statistics grid (Total Memories, Categories, Recent 7 days, Most Active)
  - Category breakdown with interactive selection and color coding
  - Recent memories grid showing last 10 memories
  - Quick create memory button
  - Refresh functionality
  - Navigation link in sidebar with Clock icon

### Changed
- **Layout component** (`frontend/src/components/Layout.jsx`):
  - Added "Recent Memories" navigation item between Dashboard and Memories
  - Imported Clock icon from lucide-react
  - Updated navItems array

- **Routing** (`frontend/src/App.jsx`):
  - Added `/recent` route for RecentMemories page
  - Imported RecentMemories component

### Documentation
- Updated `.llm-context/frontend/component-registry.md`:
  - Added Recent Memories page section
  - Updated component tree
  - Updated Layout navigation items list
  - Clarified Dashboard now shows analytics (CalendarView, DueDateWidget, AnalyticsCharts)

### Technical Details

**New Files**:
- `frontend/src/pages/RecentMemories.jsx` - Complete page component (200+ lines)

**Purpose**:
This page preserves the original dashboard functionality that shows basic stats and recent memories in a list format. The main Dashboard (`/`) now focuses on analytics visualizations (calendar, charts, due dates), while Recent Memories (`/recent`) provides the quick overview interface.

**Key Features of Recent Memories Page**:
- Uses `memoriesApi.getStats()` for statistics
- Uses `memoriesApi.getRecent(10)` for recent items
- Uses `categoriesApi.getAll()` for category data
- Includes CreateMemoryModal integration
- Shows MemoryCard components in grid layout
- Interactive category selection (click to filter - future enhancement)

---

## [2026-01-25] - Natural Language Date Search & Cleanup Management UI

### Added
- **Frontend - Natural Language Date Search**:
  - Date filter UI in Search page with expandable section
  - Quick date presets: Today, Yesterday, Last Week, Last Month, Last 3 Days, This Week
  - Custom natural language text input for date queries
  - Date field selector (memory_date, due_date, received_date)
  - Active filter indicator badge and clear button
  - Updated example queries to include date-aware examples
  - Sorting by date fields in Memories page (memory_date, due_date, received_date)

- **Frontend - Cleanup Management UI**:
  - Full CRUD interface for cleanup jobs in Settings > Data tab
  - CreateEditJobModal component with comprehensive configuration:
    - Basic info: name, description
    - Filter types: date-only, tags-only, category-only, combined
    - Date filters: field selector, operator (before/after/equals), natural language value
    - Tags filter: add/remove tags with visual chips
    - Categories filter: checkbox grid for all categories
    - Schedule configuration: manual, daily, weekly (day picker), monthly (date picker)
    - Active/inactive toggle
  - Preview functionality (dry run) showing affected memory count and samples
  - Job list view with expandable details
  - Manual run triggers with confirmation
  - Execution logs viewer modal showing success/error history
  - Color-coded status indicators (active/inactive, scheduled/manual)
  - React Portal integration for proper modal z-index layering

- **Frontend - Data Management Section**:
  - Restored "Delete All Memories" button in Settings > Data
  - Restored "Export Data" button in Settings > Data
  - Visual divider between Cleanup Management and Data Management

### Changed
- **Search page** (`frontend/src/pages/Search.jsx`):
  - Added date filters section with collapsible UI
  - Integrated dateQuery and dateField parameters in search API calls
  - Added 2 new date-aware example queries

- **Memories page** (`frontend/src/pages/Memories.jsx`):
  - Enhanced sort dropdown with 3 new date field options
  - Changed from "Date" to "Created Date" for clarity

- **Settings page** (`frontend/src/pages/Settings.jsx`):
  - Data tab restructured with two sections
  - CleanupManagement component at top
  - Original Data Management section below with divider

- **CleanupManagement component** (`frontend/src/components/CleanupManagement.jsx`):
  - Implemented React Portal for both Create/Edit and Logs modals
  - Added snake_case to camelCase payload conversion layer
  - Fixed time input to prevent repeated :00 appending
  - Added useEffect hooks to clear preview data on mount/unmount/job change
  - Removed overflow-hidden from modal containers
  - Added proper form structure with external submit button

### Fixed
- **Modal z-index issues**:
  - Problem: Modals rendered inside Settings page's overflow-hidden container
  - Solution: Used React createPortal to render modals at document.body level
  - Result: Modals appear above all content with proper backdrop

- **Modal hover glitch**:
  - Problem: Form disappeared when hovering over modal content
  - Root cause: Modal trapped inside parent container's CSS constraints
  - Solution: Portal rendering eliminates parent container influence

- **Time input bug**:
  - Problem: Each time change appended :00, creating "14:30:00:00"
  - Solution: Extract HH:MM for display value, create fresh HH:MM:SS on change

- **"Filter type is required" API error**:
  - Problem: Backend expects snake_case (filter_type), frontend sent camelCase (filterType)
  - Solution: Added payload conversion in handleSubmit and handlePreview
  - Converts: filterType → filter_type, isActive → is_active, dateField → date_field, etc.

- **Stale preview data**:
  - Problem: Preview results persisted when reopening modal
  - Solution: Clear previewData on component mount, unmount, and job change

- **Payload filtering**:
  - Problem: Sending all fields regardless of filter type
  - Solution: Conditionally include fields based on filter_type selection

### Technical Details

**React Portal Implementation**:
```javascript
return createPortal(
  <div className="fixed inset-0 z-50...">
    {/* Modal content */}
  </div>,
  document.body
)
```

**Payload Conversion Logic**:
```javascript
const payload = {
  filter_type: formData.filterType,  // snake_case for backend
  is_active: formData.isActive,
  // Conditionally add fields based on filter type
}
```

**Key Files Modified**:
- `frontend/src/pages/Search.jsx` - Date filter UI (80+ lines added)
- `frontend/src/pages/Memories.jsx` - Date field sorting (10 lines)
- `frontend/src/pages/Settings.jsx` - Data tab restructure (30 lines)
- `frontend/src/components/CleanupManagement.jsx` - New file (900+ lines)
- `CLAUDE.md` - Documentation (100+ lines added)

**Dependencies Used**:
- `react-dom` (createPortal)
- Existing: `@tanstack/react-query`, `lucide-react`
- Backend API: `cleanupApi` (already defined in api.js)

### Documentation
- Updated `CLAUDE.md`:
  - Added "Natural Language Date Search" section
  - Added "Cleanup Management System" section
  - Documented supported date phrases
  - Documented cleanup job configuration
  - Documented safety features
  - Added usage examples and troubleshooting

### Known Issues
None introduced in this session.

### Action Items
- [ ] Consider adding date range picker (calendar widget) as alternative to text input
- [ ] Add cleanup job duplication feature (clone existing job)
- [ ] Add cleanup job templates (pre-configured common patterns)
- [ ] Implement "Delete All Memories" button functionality
- [ ] Implement "Export Data" button functionality

---

## [2026-01-25] - Date Management & Analytics Feature

### Added
- **Backend**:
  - POST /api/analytics/timeline - Memory activity timeline
  - GET /api/analytics/duedates - Due date statistics
  - GET /api/analytics/busiest - Busiest times analysis
  - GET /api/analytics/summary - Summary statistics
  - GET /api/cleanup/jobs - List cleanup jobs
  - POST /api/cleanup/jobs - Create cleanup job
  - PUT /api/cleanup/jobs/:id - Update cleanup job
  - DELETE /api/cleanup/jobs/:id - Delete cleanup job
  - POST /api/cleanup/jobs/:id/run - Execute cleanup job
  - POST /api/cleanup/preview - Preview cleanup operation
  - GET /api/cleanup/logs/:jobId - Get job execution logs
  - `dateUtils.js` - Date normalization utilities (normalizeDate, formatToMMDDYY, parseRelativeDate)
  - `dateParser.js` - Natural language date parsing (15+ patterns including "yesterday", "last week", "overdue", etc.)
  - `cleanupService.js` - Automated cleanup service
  - `analyticsController.js` - Analytics endpoints
  - `cleanupController.js` - Cleanup management
  - `cleanupCron.js` - Hourly cron job runner
  
- **Frontend**:
  - Dashboard page with analytics visualization
  - CalendarView component (react-big-calendar)
  - DueDateWidget component (overdue/upcoming tracking)
  - AnalyticsCharts component (timeline and busiest times)
  - Date display on MemoryCard (Calendar, Clock, Inbox icons)
  - analyticsApi endpoints in API service
  - cleanupApi endpoints in API service
  
- **Database**:
  - Migration 004: Added date fields to memories table
    - memory_date, due_date, received_date (TIMESTAMP WITH TIME ZONE)
    - memory_date_formatted, due_date_formatted, received_date_formatted (VARCHAR(10))
    - Index on due_date
  - Migration 005: Added cleanup system tables
    - cleanup_jobs table (job configuration)
    - cleanup_job_logs table (execution history)
    - Indexes for performance

### Changed
- Backend vectorService now:
  - Accepts and normalizes all 3 date fields
  - Returns 6 date fields (timestamps + formatted)
  - Filters by date ranges
  - Provides getOverdue() and getUpcoming() methods
- Search controller accepts natural language date queries
- Chat controller retrieves date-aware context
- MemoryCard displays all date fields with conditional styling
- Memories API updated to handle date fields

### Documentation
- Updated api/endpoints-registry.md with analytics and cleanup endpoints
- Updated database/schema-overview.md with new columns and tables
- Updated database/migrations-log.md with migrations 004 and 005
- Updated frontend/component-registry.md with new components
- Updated config/dependencies.md with node-cron, react-big-calendar, recharts
- Updated QUICK_START.md with completed features

---

## [2026-01-24] - Initial .llm-context Documentation

### Added
- Comprehensive .llm-context documentation system
- API endpoints registry
- Database schema documentation
- Frontend component registry
- Architecture decisions log
- Common workflows documentation

---

**Version**: 1.1.0  
**Last Updated**: 2026-01-25
