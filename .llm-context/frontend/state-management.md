# State Management - Second Brain Frontend

## Overview

Second Brain uses a hybrid state management approach:
- **Zustand**: Global UI state (minimal)
- **TanStack Query**: Server state (primary)
- **React Context**: Authentication state
- **Local State**: Component-specific state

---

## State Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      State Layers                           │
└─────────────────────────────────────────────────────────────┘

1. Server State (TanStack Query)
   ├── Memories data
   ├── Chat sessions & messages
   ├── Search results
   ├── User profile
   └── LLM settings

2. Global UI State (Zustand - Future)
   ├── Theme (dark/light)
   ├── Sidebar collapsed state
   └── Modal visibility

3. Auth State (React Context)
   ├── Current user
   ├── Authentication status
   └── Login/logout functions

4. Local State (useState)
   ├── Form inputs
   ├── UI toggles
   └── Component-specific data
```

---

## TanStack Query (React Query)

### Configuration

**File**: `src/main.jsx`

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      cacheTime: 1000 * 60 * 30,       // 30 minutes
      refetchOnWindowFocus: false,     // Don't refetch on tab focus
      retry: 1,                        // Retry failed requests once
      refetchOnMount: true             // Refetch on component mount
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

### Query Keys

**Naming Convention**: `['resource', id?, filter?]`

```javascript
// Memories
['memories']                           // All memories
['memories', { category: 'Idea' }]     // Filtered memories
['memories', 'recent']                 // Recent memories
['memories', 'stats']                  // Memory statistics
['memory', memoryId]                   // Single memory

// Chat
['chat-sessions']                      // All chat sessions
['chat-session', sessionId]            // Single session
['chat-messages', sessionId]           // Session messages

// Search
['search', query]                      // Search results (auto-cached by query)

// Settings
['llm-settings']                       // User LLM settings
['llm-models']                         // Available models
['ollama-status']                      // Ollama availability

// User
['user', 'me']                         // Current user profile
```

---

### Query Examples

#### Fetch Memories

```javascript
import { useQuery } from '@tanstack/react-query';
import { memoriesApi } from '../services/api';

function MemoriesPage() {
  const { 
    data,           // Response data
    isLoading,      // Initial loading state
    isFetching,     // Background refetch state
    error,          // Error object
    refetch         // Manual refetch function
  } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const response = await memoriesApi.getAll();
      return response.data;
    },
    enabled: true   // Only run if condition is true
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data.memories.map(memory => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}
```

#### Filtered Queries

```javascript
function MemoriesPage() {
  const [category, setCategory] = useState('all');
  
  const { data } = useQuery({
    queryKey: ['memories', { category }],
    queryFn: () => memoriesApi.getAll({ category }),
    keepPreviousData: true  // Keep old data while fetching new
  });
  
  return (
    <div>
      <select onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All</option>
        <option value="Idea">Ideas</option>
        <option value="Task">Tasks</option>
      </select>
      
      {/* List memories */}
    </div>
  );
}
```

---

### Mutation Examples

#### Create Memory

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateMemoryModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (data) => memoriesApi.create(data),
    onSuccess: (newMemory) => {
      // Invalidate and refetch memories
      queryClient.invalidateQueries(['memories']);
      
      // Or optimistically update
      queryClient.setQueryData(['memories'], (old) => ({
        ...old,
        memories: [newMemory, ...old.memories]
      }));
      
      onClose();
    },
    onError: (error) => {
      console.error('Failed to create memory:', error);
      // Show error toast
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ raw_content: content });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button 
        type="submit" 
        disabled={createMutation.isLoading}
      >
        {createMutation.isLoading ? 'Creating...' : 'Create Memory'}
      </button>
    </form>
  );
}
```

#### Update Memory

```javascript
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => memoriesApi.update(id, data),
  onMutate: async ({ id, data }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['memory', id]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['memory', id]);
    
    // Optimistically update
    queryClient.setQueryData(['memory', id], (old) => ({
      ...old,
      ...data
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['memory', variables.id], context.previous);
  },
  onSettled: (data, error, variables) => {
    // Refetch after error or success
    queryClient.invalidateQueries(['memory', variables.id]);
    queryClient.invalidateQueries(['memories']);
  }
});
```

---

### Pagination

```javascript
function MemoriesPage() {
  const [page, setPage] = useState(1);
  const perPage = 20;
  
  const { data, isLoading } = useQuery({
    queryKey: ['memories', page],
    queryFn: () => memoriesApi.getAll({ 
      limit: perPage, 
      offset: (page - 1) * perPage 
    }),
    keepPreviousData: true  // Keep showing old page while loading new
  });
  
  return (
    <div>
      {/* Memory list */}
      
      <button 
        onClick={() => setPage(p => p - 1)} 
        disabled={page === 1}
      >
        Previous
      </button>
      
      <button 
        onClick={() => setPage(p => p + 1)}
        disabled={!data || data.memories.length < perPage}
      >
        Next
      </button>
    </div>
  );
}
```

---

## React Context (Auth)

### AuthContext

**File**: `src/context/AuthContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
    
    return userData;
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider 
      value={{ user, loading, isAuthenticated, login, logout, loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### Usage

```javascript
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, logout } = useAuth();
  
  return (
    <header>
      <span>Welcome, {user?.name}</span>
      <button onClick={logout}>Logout</button>
    </header>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

---

## Zustand (Future Global State)

### Planned Store

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Theme store
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      }))
    }),
    { name: 'theme-storage' }
  )
);

// UI store
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  }))
}));
```

---

## Local State Patterns

### Form State

```javascript
function CreateMemoryForm() {
  const [formData, setFormData] = useState({
    content: '',
    category: 'Unsorted'
  });
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <form>
      <textarea
        value={formData.content}
        onChange={(e) => handleChange('content', e.target.value)}
      />
      <select
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
      >
        {/* Options */}
      </select>
    </form>
  );
}
```

---

### Toggle State

```javascript
function MemoryCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>
      
      <button onClick={() => setShowMenu(!showMenu)}>
        Menu
      </button>
      
      {showMenu && <Dropdown />}
    </div>
  );
}
```

---

## State Management Best Practices

### 1. Choose the Right Tool

- **Server Data**: TanStack Query (always)
- **Auth State**: React Context
- **Theme/UI Preferences**: Zustand (persistent)
- **Form Inputs**: Local useState
- **Modal Visibility**: Local useState or Zustand

---

### 2. Avoid Prop Drilling

**Bad**:
```javascript
<App user={user}>
  <Dashboard user={user}>
    <Header user={user} />
  </Dashboard>
</App>
```

**Good**:
```javascript
<AuthProvider>
  <App>
    <Dashboard />
  </App>
</AuthProvider>

// In Header:
const { user } = useAuth();
```

---

### 3. Colocate State

Keep state as close to where it's used as possible.

```javascript
// Bad: Global state for component-specific data
const useGlobalStore = create((set) => ({
  modalOpen: false
}));

// Good: Local state
function Component() {
  const [modalOpen, setModalOpen] = useState(false);
}
```

---

### 4. Invalidate Queries Smartly

```javascript
// Invalidate all memories queries
queryClient.invalidateQueries(['memories']);

// Invalidate specific memory
queryClient.invalidateQueries(['memory', memoryId]);

// Invalidate multiple related queries
queryClient.invalidateQueries(['memories']);
queryClient.invalidateQueries(['memories', 'stats']);
```

---

### 5. Use Optimistic Updates

For better UX, update UI immediately before server responds.

```javascript
const deleteMutation = useMutation({
  mutationFn: memoriesApi.delete,
  onMutate: async (id) => {
    await queryClient.cancelQueries(['memories']);
    
    const previous = queryClient.getQueryData(['memories']);
    
    queryClient.setQueryData(['memories'], (old) => ({
      ...old,
      memories: old.memories.filter(m => m.id !== id)
    }));
    
    return { previous };
  },
  onError: (err, id, context) => {
    queryClient.setQueryData(['memories'], context.previous);
  }
});
```

---

## Debugging State

### React Query Devtools

```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Features**:
- View all queries and their status
- Inspect query data
- Manually refetch/invalidate
- View query timeline

---

### Zustand Devtools (Future)

```javascript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      // State here
    }),
    { name: 'MyStore' }
  )
);
```

---

**Last Updated**: 2026-01-24  
**TanStack Query**: v5.40.0  
**Zustand**: v4.5.2 (minimal usage)  
**React**: 18.3.1
