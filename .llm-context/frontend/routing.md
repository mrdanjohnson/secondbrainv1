# Routing - Second Brain Frontend

## Router Configuration

**Router**: React Router v6.24.0  
**Type**: BrowserRouter (client-side routing)

---

## Route Structure

```
/ (redirect to /dashboard if authenticated, /login if not)
├── /login (public)
├── /register (public - future)
└── Protected Routes (require authentication)
    ├── /dashboard
    ├── /memories
    ├── /search
    ├── /chat
    │   └── /chat/:sessionId (optional)
    └── /settings
```

---

## Router Setup

**File**: `src/main.jsx`

```javascript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Memories from './pages/Memories';
import Search from './pages/Search';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'memories',
        element: <Memories />
      },
      {
        path: 'search',
        element: <Search />
      },
      {
        path: 'chat',
        element: <Chat />
      },
      {
        path: 'chat/:sessionId',
        element: <Chat />
      },
      {
        path: 'settings',
        element: <Settings />
      }
    ]
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
```

---

## Route Components

### ProtectedRoute

**File**: `src/components/ProtectedRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
```

---

## Navigation

### Programmatic Navigation

```javascript
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    await login(email, password);
    navigate('/dashboard');
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

### Link Component

```javascript
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/memories">Memories</Link>
      <Link to="/search">Search</Link>
      <Link to="/chat">Chat</Link>
      <Link to="/settings">Settings</Link>
    </nav>
  );
}
```

### NavLink (Active State)

```javascript
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <nav>
      <NavLink
        to="/memories"
        className={({ isActive }) =>
          isActive
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-700 hover:bg-gray-100'
        }
      >
        Memories
      </NavLink>
    </nav>
  );
}
```

---

## Route Parameters

### Chat Session Route

```javascript
import { useParams } from 'react-router-dom';

function Chat() {
  const { sessionId } = useParams();
  
  // If sessionId exists, load that session
  // Otherwise, start new quick chat
  
  const { data } = useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: () => chatApi.getSession(sessionId),
    enabled: !!sessionId
  });
  
  return sessionId ? <SessionChat session={data} /> : <QuickChat />;
}
```

---

## Query Parameters

### Search Filters

```javascript
import { useSearchParams } from 'react-router-dom';

function MemoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const category = searchParams.get('category') || 'all';
  const tag = searchParams.get('tag');
  
  const handleFilterChange = (newCategory) => {
    setSearchParams({ category: newCategory });
  };
  
  return (
    <div>
      <select 
        value={category} 
        onChange={(e) => handleFilterChange(e.target.value)}
      >
        <option value="all">All</option>
        <option value="Idea">Ideas</option>
      </select>
      
      {/* URL: /memories?category=Idea */}
    </div>
  );
}
```

---

## Route Guards

### Authentication Check

**Already handled by** `ProtectedRoute` wrapper

### Future: Role-Based Access

```javascript
function AdminRoute({ children }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Usage
{
  path: '/admin',
  element: (
    <ProtectedRoute>
      <AdminRoute>
        <AdminPanel />
      </AdminRoute>
    </ProtectedRoute>
  )
}
```

---

## Nested Routes

### Layout with Outlet

```javascript
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet />  {/* Child routes render here */}
      </main>
    </div>
  );
}
```

---

## Navigation Hooks

### useNavigate

```javascript
const navigate = useNavigate();

navigate('/dashboard');           // Navigate to path
navigate(-1);                     // Go back
navigate(1);                      // Go forward
navigate('/login', { replace: true });  // Replace current entry
```

### useLocation

```javascript
import { useLocation } from 'react-router-dom';

function Component() {
  const location = useLocation();
  
  console.log(location.pathname);  // "/memories"
  console.log(location.search);    // "?category=Idea"
  console.log(location.hash);      // "#section"
  console.log(location.state);     // State passed via navigate
  
  return <div>Current path: {location.pathname}</div>;
}
```

### useParams

```javascript
const { sessionId, memoryId } = useParams();
```

### useSearchParams

```javascript
const [searchParams, setSearchParams] = useSearchParams();

const category = searchParams.get('category');
setSearchParams({ category: 'Idea', tag: 'ai' });
```

---

## Route Transitions (Future)

### With Framer Motion

```javascript
import { motion } from 'framer-motion';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Wrap pages
<Dashboard /> → <PageTransition><Dashboard /></PageTransition>
```

---

## 404 Page (Future)

```javascript
{
  path: '*',
  element: <NotFound />
}

function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <button onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}
```

---

## Redirect After Login

### Using location.state

```javascript
// ProtectedRoute
function ProtectedRoute({ children }) {
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Login page
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';
  
  const handleLogin = async () => {
    await login(email, password);
    navigate(from, { replace: true });
  };
}
```

---

## Lazy Loading Routes (Future)

```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Memories = lazy(() => import('./pages/Memories'));

{
  path: '/dashboard',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  )
}
```

---

## Route Configuration Reference

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | → /dashboard | Yes | Root redirect |
| `/login` | Login | No | Authentication |
| `/dashboard` | Dashboard | Yes | Overview & stats |
| `/memories` | Memories | Yes | Browse all memories |
| `/search` | Search | Yes | Semantic search |
| `/chat` | Chat | Yes | New chat session |
| `/chat/:sessionId` | Chat | Yes | Existing chat session |
| `/settings` | Settings | Yes | User settings |

---

**Last Updated**: 2026-01-24  
**React Router**: v6.24.0  
**Route Count**: 7 (+ 1 redirect)  
**Lazy Loading**: Planned for future optimization
