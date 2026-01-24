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
│       │   ├── Memories (Page)
│       │   │   ├── CreateMemoryModal
│       │   │   └── MemoryCard (multiple)
│       │   ├── Search (Page)
│       │   ├── Chat (Page)
│       │   └── Settings (Page)
│       │       └── LLMSettings
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
- Dashboard (`/dashboard`)
- Memories (`/memories`)
- Search (`/search`)
- Chat (`/chat`)
- Settings (`/settings`)

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
**Purpose**: Overview and statistics

**Features**:
- Total memory count
- Memories by category (pie chart or list)
- Recent memories (last 10)
- This week/month statistics
- Quick actions (Create Memory, Search, Chat)

**Data Fetched**:
- `/api/memories/stats`
- `/api/memories/recent`

---

### **Memories**
**File**: `src/pages/Memories.jsx`  
**Purpose**: Browse and manage all memories

**Features**:
- List of all memories (paginated)
- Filter by category
- Filter by tags
- Sort by date (newest/oldest)
- Search bar (client-side filter)
- Create new memory button
- Memory count indicator
- Infinite scroll (future) or pagination

**Layout**:
- Grid layout on desktop (2-3 columns)
- Single column on mobile
- Filter sidebar (collapsible)

**State**:
- Selected filters (category, tags)
- Current page/offset
- Sort direction

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

**Search Flow**:
1. User types query
2. Debounce 300ms
3. Call `/api/search/semantic` or `/api/search`
4. Display results with scores
5. Click to view full memory

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
- Profile settings (future)
- LLM Settings (current)
- Password change (future)
- Export data (future)
- Delete account (future)

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

**Last Updated**: 2026-01-24  
**Component Count**: ~10 (8 pages + 4 shared)  
**UI Library**: Tailwind CSS + Lucide Icons  
**State**: React Query + Zustand + Context
