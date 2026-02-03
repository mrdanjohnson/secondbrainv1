# API Endpoints Registry - Second Brain

## Base URL

**Development**: `http://localhost:3001/api`  
**Production**: Configure via environment variables

---

## Authentication Endpoints

### Register New User
```
POST /api/auth/register
```

**Headers**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response** `201 Created`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-01-24T..."
  }
}
```

**Errors**:
- `400`: Email already exists
- `400`: Validation error (weak password, invalid email)

---

### Login
```
POST /api/auth/login
```

**Headers**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors**:
- `401`: Invalid credentials

---

### Refresh Token
```
POST /api/auth/refresh
```

**Headers**:
```
Authorization: Bearer <current-token>
```

**Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Get Current User
```
GET /api/auth/me
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "preferences": {},
  "created_at": "2026-01-24T..."
}
```

---

### Update Profile
```
PUT /api/auth/profile
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Jane Doe",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

**Response** `200 OK`:
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "Jane Doe",
  "preferences": { "theme": "dark", "notifications": true }
}
```

---

### Change Password
```
POST /api/auth/change-password
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response** `200 OK`:
```json
{
  "message": "Password updated successfully"
}
```

**Errors**:
- `401`: Current password incorrect
- `400`: New password too weak

---

## Memory Endpoints

### Get All Memories
```
GET /api/memories?category=Idea&limit=20&offset=0
```

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `category` (optional): Filter by category name
- `tags` (optional): Comma-separated tags
- `limit` (optional): Default 20, max 100
- `offset` (optional): Pagination offset

**Response** `200 OK`:
```json
{
  "memories": [
    {
      "id": "uuid",
      "raw_content": "Build an AI assistant...",
      "structured_content": {
        "summary": "AI assistant idea",
        "category": "Idea",
        "tags": ["ai", "product"],
        "sentiment": "positive"
      },
      "category": "Idea",
      "tags": ["ai", "product"],
      "source": "slack",
      "created_at": "2026-01-24T...",
      "updated_at": "2026-01-24T..."
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

### Get Recent Memories
```
GET /api/memories/recent?limit=10
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "memories": [...],  // Same structure as Get All Memories
  "count": 10
}
```

---

### Get Memory Statistics
```
GET /api/memories/stats
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "total": 247,
  "by_category": {
    "Idea": 89,
    "Task": 45,
    "Reference": 67,
    "Journal": 23,
    "Learning": 15,
    "Unsorted": 8
  },
  "this_week": 12,
  "this_month": 53
}
```

---

### Get Single Memory
```
GET /api/memories/:id
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "raw_content": "...",
  "structured_content": {...},
  "category": "Idea",
  "tags": ["ai", "product"],
  "embedding": null,  // Vector not returned
  "source": "slack",
  "slack_message_ts": "1234567890.123",
  "created_at": "2026-01-24T...",
  "updated_at": "2026-01-24T..."
}
```

**Errors**:
- `404`: Memory not found

---

### Create Memory
```
POST /api/memories
```

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "raw_content": "Build an AI-powered second brain app",
  "source": "manual"  // Optional: "slack", "manual", etc.
}
```

**Response** `201 Created`:
```json
{
  "id": "uuid",
  "raw_content": "Build an AI-powered second brain app",
  "structured_content": {
    "summary": "AI second brain application idea",
    "category": "Idea",
    "tags": ["ai", "app", "productivity"],
    "sentiment": "positive",
    "priority": "high"
  },
  "category": "Idea",
  "tags": ["ai", "app", "productivity"],
  "created_at": "2026-01-24T..."
}
```

**Errors**:
- `400`: Missing raw_content
- `500`: AI classification failed

---

### Update Memory
```
PUT /api/memories/:id
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "raw_content": "Updated content",  // Optional
  "category": "Project",             // Optional
  "tags": ["updated", "revised"]     // Optional
}
```

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "raw_content": "Updated content",
  "category": "Project",
  "tags": ["updated", "revised"],
  "updated_at": "2026-01-24T..."
}
```

---

### Delete Memory
```
DELETE /api/memories/:id
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `204 No Content`

**Errors**:
- `404`: Memory not found

---

### Bulk Classify
```
POST /api/memories/bulk/classify
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "memoryIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** `200 OK`:
```json
{
  "updated": 3,
  "failed": 0,
  "results": [...]
}
```

---

### Bulk Tag
```
POST /api/memories/bulk/tag
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "memoryIds": ["uuid1", "uuid2"],
  "tags": ["important", "review"]
}
```

**Response** `200 OK`:
```json
{
  "updated": 2
}
```

---

## Search Endpoints

### Semantic Search (Smart Search with Priority Filtering)
```
POST /api/search/semantic
```

**Headers**:
```
Authorization: Bearer <token>
```

**Description**: Intelligent multi-stage search that extracts categories, tags, and dates from natural language queries. Uses 4-stage priority filtering: Date → Category → Tag → Vector Embeddings.

**Request Body**:
```json
{
  "query": "work tasks from yesterday",
  "limit": 20,
  "threshold": 0.5  // Minimum similarity score (0-1), ignored for exact category/tag matches
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "query": "work tasks from yesterday",
    "results": [
      {
        "id": "uuid",
        "raw_content": "Complete project presentation",
        "category": "work",
        "tags": ["tasks", "urgent"],
        "memory_date": "2026-01-25T14:30:00Z",
        "similarity": 0.85,
        "final_score": 5.35,  // Composite: similarity (0.85) + category boost (3.0) + tag boost (1.5)
        "match_type": "date+category+tag+semantic",
        "created_at": "..."
      }
    ],
    "analysis": {
      "originalQuery": "work tasks from yesterday",
      "cleanedQuery": "from",
      "filters": {
        "datePhrase": "yesterday",
        "categories": ["work"],
        "tags": ["tasks"],
        "exactMatches": {
          "category": "work",
          "tags": ["tasks"]
        }
      },
      "searchType": "hybrid"
    },
    "metadata": {
      "dateFiltered": true,
      "categoryFiltered": true,
      "tagFiltered": true,
      "totalMatches": 5
    }
  }
}
```

**Score Boosting**:
- Category exact match: +3.0
- Tag match: +1.5 per tag
- Vector similarity: 0.0 to 1.0
- Final score = similarity + category_boost + tag_boost

**Natural Language Support**:
- Dates: "yesterday", "this monday", "in 3 days", "Q1 2026"
- Categories: Automatically detected from query
- Tags: Automatically detected from query
- Synonyms: "meetings" → "meeting", "events" → "meeting", "todos" → "task"

**Changed in v2.0** (2026-01-26):
- Returns `final_score` instead of just `similarity`
- Added `match_type` field showing what matched
- Added `analysis` object with query parsing details
- Added `metadata` object with filter indicators

---

### Text Search
```
GET /api/search?q=productivity&category=Idea
```

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `q`: Search query (required)
- `category`: Filter by category
- `tags`: Filter by tags (comma-separated)

**Response** `200 OK`:
```json
{
  "results": [...],  // Same structure as semantic search
  "query": "productivity",
  "count": 8
}
```

---

### Get Search Suggestions
```
GET /api/search/suggestions?q=prod
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "suggestions": [
    "productivity",
    "product",
    "production"
  ]
}
```

---

## Chat Endpoints

### Quick Question (No Session)
```
POST /api/chat/quick
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "message": "What are my recent ideas about AI?"
}
```

**Response** `200 OK`:
```json
{
  "response": "Based on your memories, you have several AI-related ideas...",
  "context": [
    {
      "id": "uuid",
      "raw_content": "...",
      "similarity": 0.92
    }
  ],
  "usage": {
    "prompt_tokens": 456,
    "completion_tokens": 123,
    "total_tokens": 579
  }
}
```

---

### Create Chat Session
```
POST /api/chat/sessions
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "AI Project Discussion"  // Optional
}
```

**Response** `201 Created`:
```json
{
  "id": "session-uuid",
  "user_id": "user-uuid",
  "title": "AI Project Discussion",
  "created_at": "2026-01-24T...",
  "updated_at": "2026-01-24T..."
}
```

---

### Get User's Chat Sessions
```
GET /api/chat/sessions
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "AI Project Discussion",
      "message_count": 12,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### Get Session History
```
GET /api/chat/sessions/:sessionId
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "session": {
    "id": "uuid",
    "title": "AI Project Discussion",
    "created_at": "..."
  },
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user",
      "content": "Tell me about my AI ideas",
      "memory_context": [...],
      "created_at": "..."
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "You have several AI ideas...",
      "created_at": "..."
    }
  ]
}
```

---

### Send Message in Session
```
POST /api/chat/sessions/:sessionId/messages
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "message": "Can you elaborate on the first idea?"
}
```

**Response** `200 OK`:
```json
{
  "message": {
    "id": "msg-uuid",
    "role": "assistant",
    "content": "The first idea discusses...",
    "memory_context": [...],
    "created_at": "..."
  },
  "usage": {...}
}
```

---

### Delete Chat Session
```
DELETE /api/chat/sessions/:sessionId
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `204 No Content`

---

## LLM Settings Endpoints

### Get LLM Settings
```
GET /api/llmSettings
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "chat_provider": "openai",
  "chat_model": "gpt-4o",
  "chat_temperature": "0.7",
  "chat_max_tokens": 2048,
  "chat_relevancy_score": "0.3",
  "search_provider": "openai",
  "search_model": "gpt-4o",
  "classification_provider": "openai",
  "classification_model": "gpt-4o",
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small"
}
```

---

### Update LLM Settings
```
PUT /api/llmSettings
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "chat_provider": "anthropic",
  "chat_model": "claude-sonnet-4-20250514",
  "chat_temperature": "0.8"
}
```

**Response** `200 OK`:
```json
{
  "message": "Settings updated successfully",
  "settings": {...}
}
```

---

### Get Available Models
```
GET /api/llmSettings/models
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "openai": {
    "chat": ["gpt-4o", "gpt-4", "gpt-4o-mini"],
    "embedding": ["text-embedding-3-small", "text-embedding-3-large"]
  },
  "anthropic": {
    "chat": ["claude-sonnet-4-20250514", "claude-opus-4"]
  },
  "ollama": {
    "chat": ["llama3.2", "mistral"],
    "embedding": ["llama3.2"]
  }
}
```

---

### Get Ollama Status
```
GET /api/llmSettings/ollama/status
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "available": true,
  "models": [
    {
      "name": "llama3.2:latest",
      "size": 4700000000,
      "modified_at": "2026-01-20T..."
    }
  ]
}
```

---

### Pull Ollama Model
```
POST /api/llmSettings/ollama/pull
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "model": "llama3.2"
}
```

**Response** `200 OK`:
```json
{
  "message": "Model pull initiated",
  "model": "llama3.2"
}
```

---

### Delete Ollama Model
```
DELETE /api/llmSettings/ollama/models/:modelName
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "message": "Model deleted successfully"
}
```

---

## Category Endpoints

### Get All Categories
```
GET /api/categories
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Idea",
      "description": "Creative ideas and inspirations",
      "color": "#f59e0b",
      "created_at": "..."
    }
  ]
}
```

---

### Get Single Category
```
GET /api/categories/:id
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "name": "Idea",
  "description": "Creative ideas and inspirations",
  "color": "#f59e0b",
  "memory_count": 89
}
```

---

### Create Category
```
POST /api/categories
```

**Request Body**:
```json
{
  "name": "Reading",
  "description": "Books and articles to read",
  "color": "#22c55e"
}
```

**Response** `201 Created`

---

### Update Category
```
PUT /api/categories/:id
```

**Request Body**:
```json
{
  "name": "Reading List",
  "color": "#10b981"
}
```

**Response** `200 OK`

---

### Delete Category
```
DELETE /api/categories/:id
```

**Response** `204 No Content`

---

## Webhook Endpoint (n8n Integration)

### Receive Slack Webhook
```
POST /api/webhook
```

**Headers**:
```
Authorization: Bearer <n8n-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "content": "Message from Slack",
  "source": "slack",
  "slack_message_ts": "1234567890.123"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "memory_id": "uuid"
}
```

---

## Analytics Endpoints

### Get Timeline Statistics
```
GET /api/analytics/timeline?period=30days&groupBy=day
```

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `period` (optional): `7days`, `30days`, `90days` (default: 30days)
- `groupBy` (optional): `day`, `week`, `month` (default: day)

**Response** `200 OK`:
```json
{
  "data": {
    "timeline": [
      {
        "date": "2026-01-25",
        "count": 15
      }
    ]
  }
}
```

---

### Get Due Date Statistics
```
GET /api/analytics/duedates
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "data": {
    "overdue": {
      "count": 5,
      "memories": []
    },
    "upcoming": {
      "next7Days": { "count": 3 },
      "next30Days": { "count": 12 }
    }
  }
}
```

---

### Get Busiest Times
```
GET /api/analytics/busiest?period=30days
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "data": {
    "busiestDays": [
      { "dayName": "Monday", "count": 45 }
    ],
    "busiestHours": [
      { "hour": 14, "count": 23 }
    ]
  }
}
```

---

### Get Summary Statistics
```
GET /api/analytics/summary
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "data": {
    "totalMemories": 234,
    "categoriesCount": 8,
    "avgPerDay": 3.2,
    "thisMonth": 87
  }
}
```

---

## Cleanup Job Endpoints

### Get All Cleanup Jobs
```
GET /api/cleanup/jobs
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Weekly old tasks cleanup",
      "filters": {
        "dateField": "due_date",
        "olderThan": "30 days",
        "categories": ["Task"],
        "tags": ["completed"]
      },
      "schedule": "weekly",
      "isActive": true,
      "nextRun": "2026-02-01T00:00:00Z",
      "lastRun": "2026-01-25T00:00:00Z"
    }
  ]
}
```

---

### Create Cleanup Job
```
POST /api/cleanup/jobs
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Monthly cleanup",
  "filters": {
    "dateField": "memory_date",
    "olderThan": "90 days",
    "categories": ["Unsorted"],
    "tags": ["archived"]
  },
  "schedule": "monthly",
  "isActive": true
}
```

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "name": "Monthly cleanup",
    "createdAt": "2026-01-25T..."
  }
}
```

---

### Run Cleanup Job
```
POST /api/cleanup/jobs/:id/run
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "data": {
    "deleted": 15,
    "timestamp": "2026-01-25T..."
  }
}
```

---

### Preview Cleanup
```
POST /api/cleanup/preview
```

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "filters": {
    "dateField": "due_date",
    "olderThan": "30 days"
  }
}
```

**Response** `200 OK`:
```json
{
  "data": {
    "count": 23,
    "sample": []
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": ["Email is required", "Password too short"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

**Global Limit**: 100 requests per 15 minutes per IP address

**Excluded Endpoints**:
- `/api/auth/register`
- `/api/auth/login`

---

**API Version**: v1  
**Last Updated**: 2026-01-25  
**Recent Changes**: Added analytics and cleanup endpoints for date management feature
**For authentication details, see**: `authentication.md`  
**For error handling, see**: `error-codes.md`
