# API Error Codes - Second Brain

## Standard HTTP Status Codes

Second Brain API follows standard HTTP status code conventions. All error responses include a JSON body with `error` and `message` fields.

---

## Success Codes (2xx)

### 200 OK
**Usage**: Successful GET, PUT, PATCH requests

**Example**:
```json
{
  "memories": [...],
  "total": 150
}
```

---

### 201 Created
**Usage**: Successful POST requests (resource created)

**Example**:
```json
{
  "id": "uuid-here",
  "raw_content": "New memory",
  "created_at": "2026-01-24T..."
}
```

---

### 204 No Content
**Usage**: Successful DELETE requests

**Response**: Empty body

---

## Client Error Codes (4xx)

### 400 Bad Request
**Cause**: Invalid request data, validation errors

**Common Scenarios**:
- Missing required fields
- Invalid data format
- Business logic validation failed

**Example**:
```json
{
  "error": "Validation failed",
  "details": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

**Endpoints That May Return 400**:
- `POST /api/auth/register` - Invalid email, weak password
- `POST /api/memories` - Missing raw_content
- `PUT /api/memories/:id` - Invalid update data
- `POST /api/search/semantic` - Missing query
- `POST /api/chat/quick` - Missing message

---

### 401 Unauthorized
**Cause**: Authentication failed or missing

**Common Scenarios**:
- No token provided
- Invalid token
- Expired token
- Wrong credentials (login)

**Example**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**All Protected Endpoints Can Return 401**

**Specific Cases**:
- `POST /api/auth/login` - Wrong email/password
```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

- Missing Authorization header:
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

- Expired token:
```json
{
  "error": "Unauthorized",
  "message": "Token expired"
}
```

---

### 404 Not Found
**Cause**: Requested resource doesn't exist

**Example**:
```json
{
  "error": "Not found",
  "message": "Memory not found"
}
```

**Endpoints That May Return 404**:
- `GET /api/memories/:id` - Memory doesn't exist
- `PUT /api/memories/:id` - Memory doesn't exist
- `DELETE /api/memories/:id` - Memory doesn't exist
- `GET /api/chat/sessions/:sessionId` - Session doesn't exist
- `GET /api/categories/:id` - Category doesn't exist

---

### 409 Conflict
**Cause**: Resource already exists or conflicts with current state

**Example**:
```json
{
  "error": "Conflict",
  "message": "Email already registered"
}
```

**Endpoints That May Return 409**:
- `POST /api/auth/register` - Email already exists
- `POST /api/categories` - Category name already exists

---

### 429 Too Many Requests
**Cause**: Rate limit exceeded

**Example**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 900
}
```

**Rate Limit Configuration**:
- **Limit**: 100 requests per 15 minutes
- **Scope**: Per IP address
- **Excluded Endpoints**: None (all protected)
- **Reset**: 15 minutes from first request

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706112900
Retry-After: 900
```

---

## Server Error Codes (5xx)

### 500 Internal Server Error
**Cause**: Unexpected server error

**Example**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Common Scenarios**:
- Database connection failed
- LLM API call failed
- Unhandled exception in code

**Note**: In development, may include stack trace. In production, generic message only.

---

### 503 Service Unavailable
**Cause**: Service temporarily unavailable

**Example**:
```json
{
  "error": "Service unavailable",
  "message": "Database is currently unavailable"
}
```

**Common Scenarios**:
- PostgreSQL down
- Ollama service unavailable
- External API (OpenAI, Anthropic) timeout

---

## Error Response Format

All errors follow this structure:

```typescript
interface ErrorResponse {
  error: string;           // Error type/category
  message: string;         // Human-readable message
  details?: string[];      // Optional array of validation errors
  statusCode?: number;     // HTTP status code (redundant but helpful)
  timestamp?: string;      // ISO timestamp of error
}
```

---

## Endpoint-Specific Errors

### Authentication Endpoints

#### POST /api/auth/register

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Validation failed | Invalid email format |
| 400 | Validation failed | Password < 8 characters |
| 409 | Email already registered | User exists with this email |
| 500 | Failed to create user | Database error |

#### POST /api/auth/login

| Status | Error | Cause |
|--------|-------|-------|
| 401 | Invalid credentials | Wrong email or password |
| 400 | Validation failed | Missing email or password |
| 500 | Authentication failed | Database/JWT error |

---

### Memory Endpoints

#### POST /api/memories

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing raw_content | No content provided |
| 401 | Unauthorized | No/invalid token |
| 500 | Failed to create memory | DB or AI service error |

**AI Service Errors**:
If AI classification fails, the memory is still created with:
- `category`: "Unsorted"
- `structured_content`: null
- `tags`: []

#### GET /api/memories/:id

| Status | Error | Cause |
|--------|-------|-------|
| 404 | Memory not found | Invalid UUID or deleted |
| 401 | Unauthorized | No/invalid token |
| 500 | Failed to fetch memory | Database error |

---

### Search Endpoints

#### POST /api/search/semantic

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing query | No search query provided |
| 401 | Unauthorized | No/invalid token |
| 500 | Search failed | Embedding generation failed |
| 500 | Search failed | Database vector search error |

**Embedding Errors**:
- OpenAI API timeout → 500
- Invalid API key → 500 (logged, not exposed)
- Rate limit hit → 500

---

### Chat Endpoints

#### POST /api/chat/quick

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing message | No message in request |
| 401 | Unauthorized | No/invalid token |
| 500 | Chat failed | LLM API error |
| 500 | Chat failed | Context retrieval failed |

**LLM Provider Errors**:
- OpenAI API error → 500 with generic message
- Anthropic API error → 500 with generic message
- Ollama unavailable → 500 "LLM service unavailable"

#### POST /api/chat/sessions/:sessionId/messages

| Status | Error | Cause |
|--------|-------|-------|
| 404 | Session not found | Invalid sessionId |
| 400 | Missing message | No message in request |
| 401 | Unauthorized | No/invalid token |
| 500 | Chat failed | LLM or DB error |

---

### LLM Settings Endpoints

#### PUT /api/llmSettings

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid settings | Invalid provider/model combination |
| 401 | Unauthorized | No/invalid token |
| 500 | Failed to update | Database error |

#### POST /api/llmSettings/ollama/pull

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing model | No model name provided |
| 503 | Ollama unavailable | Ollama service not running |
| 500 | Pull failed | Ollama pull error |

---

## Error Handling Best Practices

### Backend (Express)

```javascript
// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default to 500 if no status code
  const statusCode = err.statusCode || 500;

  // Don't leak stack traces in production
  const message = process.env.NODE_ENV === 'production' 
    ? err.message 
    : err.stack || err.message;

  res.status(statusCode).json({
    error: err.name || 'Internal server error',
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  });
};
```

### Frontend (React)

```javascript
// API service with error handling
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
        
      case 429:
        // Show rate limit message
        toast.error('Too many requests. Please try again later.');
        break;
        
      case 500:
        // Show generic error
        toast.error('Something went wrong. Please try again.');
        break;
        
      default:
        // Show specific error message
        toast.error(data.message || 'An error occurred');
    }
  } else if (error.request) {
    // Request made but no response (network error)
    toast.error('Network error. Please check your connection.');
  } else {
    // Something else happened
    toast.error('An unexpected error occurred');
  }
};
```

---

## Debugging Errors

### Development Environment

**Enable Detailed Errors**:
```javascript
// backend/src/index.js
if (process.env.NODE_ENV === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      error: err.name,
      message: err.message,
      stack: err.stack,
      details: err.details
    });
  });
}
```

**Logging**:
```javascript
import morgan from 'morgan';

// Log all requests in development
app.use(morgan('dev'));
```

### Production Environment

**Generic Errors Only**:
- Never expose stack traces
- Log full errors server-side
- Return generic messages to client

**Monitoring**:
- Log to file or service (e.g., Sentry)
- Track error rates
- Alert on threshold exceeded

---

## Error Codes Quick Reference

| Code | Name | Meaning | Action |
|------|------|---------|--------|
| 200 | OK | Success | Continue |
| 201 | Created | Resource created | Continue |
| 204 | No Content | Deleted successfully | Continue |
| 400 | Bad Request | Invalid data | Fix request |
| 401 | Unauthorized | Auth failed | Re-login |
| 404 | Not Found | Resource missing | Check ID |
| 409 | Conflict | Already exists | Use different value |
| 429 | Too Many Requests | Rate limited | Wait & retry |
| 500 | Internal Server Error | Server problem | Retry or report |
| 503 | Service Unavailable | Service down | Wait & retry |

---

**Last Updated**: 2026-01-24  
**Error Handler**: Express middleware  
**Frontend Error Handling**: Axios interceptors + React error boundaries (future)
