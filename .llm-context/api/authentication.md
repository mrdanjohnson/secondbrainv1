# Authentication - Second Brain API

## Overview

Second Brain uses **JWT (JSON Web Tokens)** for stateless authentication. Tokens are generated on login and must be included in the `Authorization` header for all protected endpoints.

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Registration                                             │
└─────────────────────────────────────────────────────────────┘

User → Frontend
    │ Enters email, password, name
    │
    ▼
POST /api/auth/register
    │ {
    │   "email": "user@example.com",
    │   "password": "securePassword123",
    │   "name": "John Doe"
    │ }
    │
    ▼
Backend Validation
    │ 1. Check email format (RFC 5322)
    │ 2. Check email not already registered (UNIQUE constraint)
    │ 3. Validate password strength (min 8 chars)
    │
    ▼
Password Hashing
    │ bcrypt.hash(password, 10)
    │ → "$2a$10$abcdef..." (60 char hash)
    │
    ▼
Create User in Database
    │ INSERT INTO users (
    │   id,                -- UUID (auto-generated)
    │   email,             -- user@example.com
    │   password_hash,     -- bcrypt hash
    │   name,              -- John Doe
    │   preferences,       -- {} (empty JSONB)
    │   created_at,        -- NOW()
    │   updated_at         -- NOW()
    │ )
    │
    ▼
Generate JWT Token
    │ Payload: {
    │   userId: "uuid-here",
    │   email: "user@example.com",
    │   iat: 1234567890,      // Issued at (Unix timestamp)
    │   exp: 1234654290       // Expires (24h later)
    │ }
    │ Sign with process.env.JWT_SECRET (HS256 algorithm)
    │
    ▼
Return to Frontend
    │ {
    │   "token": "eyJhbGciOiJIUzI1NiIs...",
    │   "user": { "id": "...", "email": "...", "name": "..." }
    │ }

┌─────────────────────────────────────────────────────────────┐
│ 2. Login                                                    │
└─────────────────────────────────────────────────────────────┘

User → Frontend
    │ Enters email, password
    │
    ▼
POST /api/auth/login
    │ {
    │   "email": "user@example.com",
    │   "password": "securePassword123"
    │ }
    │
    ▼
Database Lookup
    │ SELECT * FROM users WHERE email = $1
    │ → If not found: 401 Unauthorized
    │
    ▼
Password Verification
    │ bcrypt.compare(password, user.password_hash)
    │ → If false: 401 Unauthorized
    │
    ▼
Generate JWT Token
    │ (Same process as registration)
    │
    ▼
Return to Frontend
    │ {
    │   "token": "eyJhbGciOiJIUzI1NiIs...",
    │   "user": { "id": "...", "email": "...", "name": "..." }
    │ }

┌─────────────────────────────────────────────────────────────┐
│ 3. Token Storage (Frontend)                                │
└─────────────────────────────────────────────────────────────┘

Frontend receives token
    │
    ▼
Store in localStorage
    │ localStorage.setItem('token', token)
    │
    ▼
Update Zustand Store
    │ authStore.setUser(user)
    │ authStore.setToken(token)
    │
    ▼
Redirect to Dashboard
    │ navigate('/dashboard')

┌─────────────────────────────────────────────────────────────┐
│ 4. Protected API Requests                                  │
└─────────────────────────────────────────────────────────────┘

Frontend makes API call
    │
    ▼
Axios Interceptor
    │ const token = localStorage.getItem('token')
    │ config.headers.Authorization = `Bearer ${token}`
    │
    ▼
GET /api/memories
    │ Headers: {
    │   Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
    │ }
    │
    ▼
Auth Middleware (Backend)
    │ 1. Extract token from header:
    │    const token = req.headers.authorization?.split(' ')[1]
    │ 
    │ 2. Verify token:
    │    const decoded = jwt.verify(token, JWT_SECRET)
    │    → If invalid: throw 401 Unauthorized
    │    → If expired: throw 401 Unauthorized
    │
    │ 3. Attach user to request:
    │    req.user = { id: decoded.userId, email: decoded.email }
    │
    │ 4. Call next() to proceed to controller
    │
    ▼
Controller Access
    │ const userId = req.user.id
    │ // Use userId for database queries
    │ SELECT * FROM memories WHERE user_id = $1

┌─────────────────────────────────────────────────────────────┐
│ 5. Token Refresh                                           │
└─────────────────────────────────────────────────────────────┘

Token Near Expiry (frontend detects)
    │
    ▼
POST /api/auth/refresh
    │ Headers: { Authorization: "Bearer <current-token>" }
    │
    ▼
Backend Validates & Generates New Token
    │ 1. Verify current token (even if expired < 7 days)
    │ 2. Generate new token (fresh 24h expiry)
    │
    ▼
Return New Token
    │ { "token": "eyJhbGciOiJIUzI1NiIs..." }
    │
    ▼
Frontend Updates Storage
    │ localStorage.setItem('token', newToken)

┌─────────────────────────────────────────────────────────────┐
│ 6. Logout                                                  │
└─────────────────────────────────────────────────────────────┘

User Clicks Logout
    │
    ▼
Frontend Cleanup
    │ 1. localStorage.removeItem('token')
    │ 2. authStore.clearUser()
    │ 3. navigate('/login')
    │
    │ Note: No backend call needed (stateless JWT)
```

---

## JWT Token Structure

### Payload
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1706112000,
  "exp": 1706198400
}
```

### Fields
- **userId**: User's UUID from database
- **email**: User's email address
- **iat**: Issued at (Unix timestamp)
- **exp**: Expiration (Unix timestamp, 24 hours after iat)

### Algorithm
- **HS256**: HMAC with SHA-256
- **Secret**: Stored in `process.env.JWT_SECRET`

---

## Security Measures

### Password Security
1. **bcrypt Hashing**: 10 salt rounds
2. **Min Length**: 8 characters
3. **No Plain Text**: Password never stored or logged
4. **Comparison**: bcrypt.compare() for constant-time comparison

### Token Security
1. **Signing**: JWT_SECRET (256-bit minimum)
2. **Expiration**: 24-hour default
3. **HTTPS Only**: Production should use HTTPS
4. **No Sensitive Data**: Token contains only userId and email

### Additional Security
1. **Rate Limiting**: 100 requests/15min (prevents brute force)
2. **Helmet.js**: Security headers
3. **CORS**: Whitelist allowed origins
4. **Environment Variables**: Secrets never in code

---

## Middleware Implementation

### Auth Middleware (`/backend/src/middleware/auth.js`)

```javascript
export const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token expired' 
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication failed' 
    });
  }
};
```

---

## Frontend Integration

### Axios Configuration

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Auth Context

```javascript
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token is still valid by fetching user
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## Protected Routes

### Implementation

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

### Usage

```javascript
// src/main.jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
  
  <Route path="/memories" element={
    <ProtectedRoute>
      <Memories />
    </ProtectedRoute>
  } />
</Routes>
```

---

## Common Authentication Errors

### 401 Unauthorized

**Causes**:
- No token provided
- Token expired (> 24 hours old)
- Invalid token signature
- JWT_SECRET mismatch

**Solution**:
- Redirect to login page
- Clear localStorage token
- Prompt user to log in again

### 400 Bad Request

**Causes** (during registration/login):
- Missing required fields
- Invalid email format
- Password too short
- Email already exists (registration)

**Solution**:
- Display validation errors to user
- Highlight problematic fields

---

## Best Practices

### Backend
1. **Never log tokens**: Avoid logging Authorization headers
2. **Rotate JWT_SECRET**: Change periodically in production
3. **Use HTTPS**: Prevent token interception
4. **Short expiration**: 24 hours maximum
5. **Validate on every request**: Don't cache auth status

### Frontend
1. **Store in localStorage**: Simple, works across tabs
2. **Clear on logout**: Always remove token
3. **Handle expiration gracefully**: Redirect to login
4. **Don't decode sensitive data**: Token is for auth, not storage
5. **Refresh before expiry**: Prevent interruption

---

## Future Enhancements

### Refresh Token Pattern
- **Current**: Single JWT with 24h expiry
- **Future**: Short-lived access token (15min) + long-lived refresh token (30 days)
- **Benefit**: More secure, can revoke refresh tokens

### OAuth Integration
- **Providers**: Google, GitHub, Microsoft
- **Use Case**: Simplify registration/login
- **Implementation**: Passport.js middleware

### Multi-Factor Authentication (MFA)
- **Methods**: TOTP (Google Authenticator), SMS, Email
- **Use Case**: High-security accounts
- **Implementation**: speakeasy package

---

**Last Updated**: 2026-01-24  
**JWT Version**: jsonwebtoken 9.0.2  
**Password Hashing**: bcryptjs 2.4.3  
**Token Expiry**: 24 hours
