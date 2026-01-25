# Component Registry - Second Brain Frontend

## Overview

This document catalogs all React components in the Second Brain frontend application, including their props, usage, and examples.

---

## Component Tree

```
App
├── AuthProvider (Context)
│   ├── Login (Page)
│   ├── Register (Page - future)
│   └── Protected Routes
│       ├── Layout
│       │   ├── Dashboard (Page)
│       │   ├── Recent Memories (Page)
│       │   │   ├── CreateMemoryModal
│       │   │   └── MemoryCard (multiple)
│       │   ├── Memories (Page)
│       │   │   ├── CreateMemoryModal
│       │   │   └── MemoryCard (multiple)
│       │   ├── Search (Page)
│       │   ├── Chat (Page)
│       │   └── Settings (Page)
│       │       ├── LLMSettings
│       │       └── CleanupManagement
└── React Query Provider
```

---

## Layout Components

### **Layout**
**File**: `src/components/Layout.jsx`  
**Purpose**: Main application wrapper with sidebar navigation

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

**Features**:
- Responsive sidebar (collapsible on mobile)
- Navigation menu with active state
- User profile dropdown
- Logout button

**Navigation Items**:
- Dashboard (`/`) - Analytics and visualizations
- Recent Memories (`/recent`) - Quick view with stats and recent memories
- Memories (`/memories`) - Full list with advanced filtering
- Search (`/search`) - Semantic search with natural language dates
- Chat (`/chat`) - AI chat with RAG
- Settings (`/settings`) - Configuration and cleanup management

**Usage**:
```jsx
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
```

---

## Memory Components

### **MemoryCard**
**File**: `src/components/MemoryCard.jsx`  
**Purpose**: Display individual memory with actions

**Props**:
```typescript
interface MemoryCardProps {
  memory: {
    id: string;
    rawContent: string;
    category: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    memoryDateFormatted?: string;      // NEW (v1.1.0)
    dueDateFormatted?: string;          // NEW (v1.1.0)
    receivedDateFormatted?: string;     // NEW (v1.1.0)
    dueDate?: string;                   // NEW (v1.1.0)
    structured_content?: {
      summary: string;
      sentiment: string;
      priority: string;
    };
  };
  onUpdate?: () => void;
  compact?: boolean;
}
```

**Features**:
- Colored category badge (8 category colors)
- Tag display (up to 5 visible, "+N more" for extra)
- **Date display with icons** (NEW v1.1.0):
  - Memory date (Calendar icon)
  - Due date (Clock/AlertCircle icon, red if overdue)
  - Received date (Inbox icon)
- Edit mode (inline editing)
- Delete with confirmation
- Dropdown menu (Edit, Delete)
- Date formatting (relative and absolute)
- Truncate long content (expandable)

**Category Colors**:
- **Idea**: Amber (#f59e0b)
- **Task**: Red (#ef4444)
- **Project**: Purple (#8b5cf6)
- **Reference**: Emerald (#10b981)
- **Journal**: Blue (#3b82f6)
- **Meeting**: Pink (#ec4899)
- **Learning**: Cyan (#06b6d4)
- **Unsorted**: Slate (#6b7280)

**Usage**:
```jsx
<MemoryCard 
  memory={memory}
  onUpdate={() => refetch()}
  compact={false}
/>
```

**Variants**:
- **Default**: Full card with all details
- **Compact**: Smaller version for lists

---

### **CreateMemoryModal**
**File**: `src/components/CreateMemoryModal.jsx`  
**Purpose**: Modal for creating new memories

**Props**:
```typescript
interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Features**:
- Textarea for content (auto-resize)
- Character count (max 10,000)
- Loading state during creation
- Error handling
- AI classification indicator
- Close on Escape key
- Click outside to close

**Form Validation**:
- Min length: 10 characters
- Max length: 10,000 characters
- Required field

**Usage**:
```jsx
const [isOpen, setIsOpen] = useState(false);

<CreateMemoryModal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={() => {
    refetch();
    setIsOpen(false);
  }}
/>
```

---

## Settings Components

### **LLMSettings**
**File**: `src/components/LLMSettings.jsx`  
**Purpose**: Configure LLM providers and models

**Props**: None (uses internal state + React Query)

**Features**:
- Provider selection (OpenAI, Anthropic, Ollama)
- Model selection per feature area:
  - Chat
  - Search
  - Classification
  - Embeddings
- Temperature slider (0.0 - 2.0)
- Max tokens input
- Relevancy score threshold
- Ollama model management:
  - Pull models
  - Delete models
  - View available models

**Form Sections**:
1. **Chat Settings**
   - Provider, Model, Temperature, Max Tokens, Relevancy Score
2. **Search Settings**
   - Provider, Model, Temperature, Max Tokens, Relevancy Score
3. **Classification Settings**
   - Provider, Model, Temperature, Max Tokens
4. **Embedding Settings**
   - Provider, Model

**Usage**:
```jsx
import LLMSettings from './components/LLMSettings';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <LLMSettings />
    </div>
  );
}
```

**State Management**:
- Uses TanStack Query for server state
- Local state for form inputs
- Optimistic updates on save

---

## Page Components

### **Dashboard**
**File**: `src/pages/Dashboard.jsx`
**Purpose**: Analytics dashboard with visualizations

**Features** (UPDATED v1.1.0):
- Summary statistics cards (Total Memories, Categories, Avg per Day, This Month)
- CalendarView component (month view with memory density)
- DueDateWidget (overdue and upcoming tasks)
- AnalyticsCharts (timeline activity, busiest times)

**Data Fetched**:
- `/api/analytics/summary` - Summary statistics
- `/api/analytics/timeline` - Timeline data for charts
- `/api/analytics/duedates` - Due date statistics
- `/api/analytics/busiest` - Busiest times analysis

---

### **Recent Memories**
**File**: `src/pages/RecentMemories.jsx`
**Purpose**: Quick overview with stats and recent memories (ADDED v1.2.0)

**Features**:
- Statistics grid (Total Memories, Categories, Recent 7 days, Most Active)
- Category breakdown with interactive selection
- Recent memories list (last 10)
- Quick create memory button
- Refresh button

**Data Fetched**:
- `/api/memories/stats` - Basic statistics
- `/api/memories/recent` - Recent memories
- `/api/categories` - Category list

**Usage**:
```jsx
// Shows overview similar to original dashboard
// Includes MemoryCard components for recent items
// CreateMemoryModal for quick memory creation
```

---

### **Memories**
**File**: `src/pages/Memories.jsx`
**Purpose**: Browse and manage all memories

**Features**:
- List of all memories (paginated)
- Filter by category
- Filter by tags
- **Sort by multiple date fields** (UPDATED v1.2.0):
  - Created Date
  - Memory Date
  - Due Date
  - Received Date
  - Category
- Search bar (client-side filter)
- Create new memory button
- Memory count indicator
- Grid/List view toggle
- Infinite scroll (future) or pagination

**Layout**:
- Grid layout on desktop (2-3 columns)
- Single column on mobile
- Filter sidebar (collapsible)

**State**:
- Selected filters (category, tags)
- Current page/offset
- Sort field and direction
- View mode (grid/list)

---

### **Search**
**File**: `src/pages/Search.jsx`
**Purpose**: Semantic and text search

**Features**:
- Search input with debounce (300ms)
- Search type toggle:
  - Semantic (vector similarity)
  - Text (keyword search)
- Result cards with similarity scores
- Filter by category
- Sort by similarity/relevance
- No results state
- **Natural language date filters** (NEW v1.2.0):
  - Expandable date filter section
  - Quick presets: Today, Yesterday, Last Week, Last Month, Last 3 Days, This Week
  - Custom text input for natural language queries
  - Date field selector (memory_date, due_date, received_date)
  - Active filter indicator with clear button

**Search Flow**:
1. User types query
2. (Optional) User adds date filter
3. Debounce 300ms
4. Call `/api/search/semantic` with dateQuery and dateField params
5. Display results with scores
6. Click to view full memory

---

### **Chat**
**File**: `src/pages/Chat.jsx`  
**Purpose**: RAG-powered chat interface

**Features**:
- Session list (sidebar)
- Create new session
- Delete session
- Message history
- Input box with auto-resize
- "Thinking..." indicator
- Context display (expandable)
- Similarity scores for context
- Token usage display
- Copy message text
- Regenerate response (future)

**Chat Layout**:
```
┌─────────────────────────────────────┐
│  Sessions  │   Chat Window          │
│            │                         │
│  + New     │   [Messages]            │
│            │                         │
│  Session 1 │   User: Question?       │
│  Session 2 │   AI: Answer...         │
│  Session 3 │                         │
│            │   Context: [3 memories] │
│            │                         │
│            │   [Input box]           │
└─────────────────────────────────────┘
```

**Message Types**:
- User messages (right-aligned, blue)
- Assistant messages (left-aligned, gray)
- System messages (centered, small)

---

### **Login**
**File**: `src/pages/Login.jsx`  
**Purpose**: User authentication

**Features**:
- Email input
- Password input (toggleable visibility)
- Remember me checkbox (future)
- Submit button
- Error messages
- Link to register (future)
- Loading state

**Form Validation**:
- Email format check
- Password required
- Display API errors

---

### **Settings**
**File**: `src/pages/Settings.jsx`
**Purpose**: User settings and preferences

**Features**:
- Tabbed interface (Profile, Security, API, LLM Settings, Notifications, Appearance, Data)
- Profile settings
- Password change
- API access documentation with examples
- LLM Settings component
- Notification preferences (future)
- Appearance/theme settings (future)
- **Data Management** (NEW v1.2.0):
  - Cleanup Management section (see CleanupManagement component)
  - Export data button
  - Delete all memories button
  - Danger zone warnings

---

## Shared/Utility Components

### **Button** (Future - Extracted Pattern)
**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Usage Pattern** (currently inline):
```jsx
<button
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  onClick={handleClick}
>
  Save
</button>
```

---

### **Modal** (Pattern)
**Used In**: CreateMemoryModal

**Pattern**:
```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        {/* Modal content */}
      </div>
    </div>
  </div>
)}
```

---

### **LoadingSpinner** (Pattern)
**Used Throughout**: Pages and components

**Pattern**:
```jsx
{loading && (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
  </div>
)}
```

---

## Icon Usage

### **Lucide React Icons**
**Package**: `lucide-react`  
**Version**: 0.379.0

**Commonly Used Icons**:
- `MessageSquare` - Chat
- `Search` - Search
- `Brain` - Memories/Logo
- `Settings` - Settings
- `Tag` - Tags
- `Calendar` - Dates
- `Edit2` - Edit
- `Trash2` - Delete
- `Plus` - Add/Create
- `X` - Close
- `ChevronDown` - Dropdown
- `MoreVertical` - Menu
- `ExternalLink` - Open in new

**Usage**:
```jsx
import { MessageSquare, Search } from 'lucide-react';

<MessageSquare className="w-5 h-5" />
<Search className="w-4 h-4 text-gray-500" />
```

---

## Component Patterns

### Data Fetching (TanStack Query)

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function MemoriesPage() {
  const queryClient = useQueryClient();
  
  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['memories'],
    queryFn: () => memoriesApi.getAll()
  });
  
  // Mutate data
  const createMutation = useMutation({
    mutationFn: memoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['memories']);
    }
  });
  
  return (
    // Component JSX
  );
}
```

---

### Form Handling

```jsx
const [formData, setFormData] = useState({ email: '', password: '' });

const handleChange = (e) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  // Submit logic
};
```

---

### Modal Management

```jsx
const [isOpen, setIsOpen] = useState(false);

// In render
<button onClick={() => setIsOpen(true)}>Open Modal</button>

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  {/* Content */}
</Modal>
```

---

## Component Best Practices

1. **Prop Validation**: Use TypeScript or PropTypes (future)
2. **Error Boundaries**: Wrap pages in error boundaries (future)
3. **Loading States**: Always show loading indicators
4. **Empty States**: Handle no data gracefully
5. **Accessibility**: Use semantic HTML, ARIA labels
6. **Responsive**: Mobile-first design with Tailwind
7. **Performance**: Lazy load pages with React.lazy (future)

---

## Analytics & Dashboard Components (v1.1.0)

### **CalendarView**
**File**: `src/components/CalendarView.jsx`  
**Purpose**: Visual calendar display of memories by date

**Props**: None (uses React Query internally)

**Features**:
- Full month/week/day calendar views
- Color-coded by category
- Shows all 3 date types:
  - Memory dates (standard events)
  - Due dates (📌 prefix)
  - Received dates (📥 prefix)
- Click event to view details modal
- Tooltips on hover
- Responsive layout

**Dependencies**:
- react-big-calendar
- date-fns
- memoriesApi.getAll()

**Usage**:
```jsx
<CalendarView />
```

---

### **DueDateWidget**
**File**: `src/components/DueDateWidget.jsx`  
**Purpose**: Display overdue and upcoming due dates

**Props**: None (uses React Query internally)

**Features**:
- Overdue count (red, AlertCircle icon)
- Next 7 days count (orange, Clock icon)
- Next 30 days count (yellow, CheckCircle icon)
- Click to navigate to filtered memories
- Auto-refresh every minute
- "All caught up" state when empty

**API Dependencies**:
- analyticsApi.getDueDateStats()

**Navigation**:
- Overdue → `/memories?filter=overdue`
- Next 7 days → `/memories?filter=due7days`
- Next 30 days → `/memories?filter=due30days`

**Usage**:
```jsx
<DueDateWidget />
```

---

### **AnalyticsCharts**
**File**: `src/components/AnalyticsCharts.jsx`  
**Purpose**: Timeline and activity visualization

**Props**: None (uses React Query internally)

**Features**:
- Memory activity line chart (timeline)
- Busiest days of week bar chart
- Period selector (7/30/90 days)
- Responsive charts
- Loading states
- Empty states

**Dependencies**:
- recharts (LineChart, BarChart)
- date-fns (formatting)
- analyticsApi.getTimeline()
- analyticsApi.getBusiestTimes()

**Usage**:
```jsx
<AnalyticsCharts />
```

---

## Cleanup Management Components (v1.2.0)

### **CleanupManagement**
**File**: `src/components/CleanupManagement.jsx`
**Purpose**: Full CRUD interface for automated cleanup jobs

**Props**: None (uses React Query + local state)

**Features**:
- Job list with expandable detail cards
- Create/Edit modal for job configuration
- Preview functionality (dry run)
- Manual run triggers
- Execution logs viewer
- Color-coded status indicators
- React Portal rendering for modals

**Sub-components** (internal):
- `CreateEditJobModal` - Configuration modal (800+ lines)
- `JobLogsModal` - Execution history viewer

**Job Configuration**:
- Basic info: name, description, active/inactive
- Filter types: date, tag, category, combined
- Date filters: field (memory_date/due_date/received_date), operator (before/after/equals), value
- Tags filter: array of tags
- Categories filter: array of categories
- Schedule: manual, daily, weekly, monthly
- Time picker for scheduled jobs

**API Integration**:
- Uses `cleanupApi` from services/api.js
- Converts camelCase → snake_case for backend
- Conditionally includes fields based on filter type

**Modal Implementation**:
```jsx
createPortal(
  <div className="fixed inset-0...">
    {/* Modal content */}
  </div>,
  document.body
)
```

**State Management**:
- Local state for form data
- React Query for job list, logs, preview
- Preview data cleared on mount/unmount
- Time input normalized (HH:MM → HH:MM:SS)

**Usage**:
```jsx
<CleanupManagement />
```

**Features**:
1. **Job List View**:
   - Expandable cards with job details
   - Status badges (Active/Inactive, Schedule type)
   - Action buttons: Edit, Logs, Run, Delete
   - Job statistics (last run, deleted count)

2. **Create/Edit Modal**:
   - Multi-step form with validation
   - Preview button shows affected memories
   - Conditional field display based on filter type
   - Snake_case payload conversion

3. **Logs Modal**:
   - Success/error status indicators
   - Execution type badges (manual/scheduled)
   - Deleted memory counts
   - Error messages for failed runs

**Validation**:
- Required: name, filter_type, schedule
- Conditional: date fields for date filter, tags for tag filter, etc.
- Preview validates configuration before showing results

**UI Patterns**:
- Card-based layout with hover effects
- Collapsible sections for advanced options
- Color-coded status (green=active, gray=inactive)
- Icon indicators (Clock, Calendar, Tag, Folder)

---

## Future Components

### Planned
- **Table** - Reusable data table
- **Select** - Styled dropdown
- **Input** - Reusable form input
- **Card** - Generic card component
- **Badge** - Tag/label component
- **Toast** - Notification system
- **Dropdown** - Generic dropdown menu
- **Tabs** - Tab navigation
- **Pagination** - Page controls

---

**Last Updated**: 2026-01-25
**Last Changed By**: Natural Language Date Search & Cleanup Management UI
**Change Summary**: Added date filter UI to Search page, date sorting to Memories page, CleanupManagement component (~900 lines) with React Portal modals
**Component Count**: ~13 (8 pages + 5 major components)
**UI Library**: Tailwind CSS + Lucide Icons
**State**: React Query + Zustand + Context
