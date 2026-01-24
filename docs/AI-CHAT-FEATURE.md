# AI Chat Feature Documentation

## 1. Feature Overview

### Purpose
The AI Chat feature enables users to have intelligent conversations with their "Second Brain" by leveraging Retrieval-Augmented Generation (RAG). The system searches through stored memories using vector similarity and provides contextually relevant responses powered by either OpenAI's GPT-4 or Anthropic's Claude models.

### User Stories

**As a user, I want to:**
- Ask questions about information I've previously stored in my Second Brain
- Have multi-turn conversations with context from my memories
- View which memories were used to answer my questions
- Organize conversations into sessions for different topics
- Get quick one-off answers without creating a session

### Key Workflows

1. **Session-based Chat**: Users create chat sessions and have multi-turn conversations where history is maintained
2. **Quick Questions**: Users ask single questions without creating a persistent session
3. **Context Retrieval**: System automatically finds relevant memories and provides them as context to the AI
4. **Session Management**: Users can view, select, and delete previous conversations

### Scope

**Included:**
- Multi-turn conversational AI with memory context
- Vector-based semantic search for relevant memories
- Session management and history
- Support for both OpenAI (GPT-4) and Anthropic (Claude) models
- Source attribution (showing which memories were used)
- Real-time message streaming interface

**Out of Scope:**
- Voice/audio chat
- File attachments in chat
- Chat export functionality
- Multi-user chat rooms
- Custom AI model training
- Image generation

---

## 2. Technical Architecture

### Framework/Stack

**Backend:**
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Language**: JavaScript (ES2022+)

**Frontend:**
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.3.1
- **State Management**: TanStack Query (React Query) 5.40.0
- **UI Library**: Custom components with Tailwind CSS 3.4.4

**Database:**
- **Primary Database**: PostgreSQL with pgvector extension
- **Vector Dimensions**: 1536 (OpenAI text-embedding-3-small)

### Language Versions
- **Node.js**: 18+ (required for ES modules)
- **PostgreSQL**: 14+ (for pgvector support)
- **React**: 18.3.1

### Key Dependencies

**Backend:**
```json
{
  "openai": "^4.47.1",           // OpenAI API client
  "@anthropic-ai/sdk": "^0.39.0", // Claude API client
  "express": "^4.19.2",           // Web framework
  "jsonwebtoken": "^9.0.2",       // Authentication
  "pg": "^8.11.5",                // PostgreSQL client
  "uuid": "^9.0.1"                // Session ID generation
}
```

**Frontend:**
```json
{
  "@tanstack/react-query": "^5.40.0", // Data fetching/caching
  "axios": "^1.7.2",                   // HTTP client
  "lucide-react": "^0.379.0",          // Icons
  "react-router-dom": "^6.24.0",       // Routing
  "react-markdown": "^9.0.1"           // Markdown rendering
}
```

### Design Patterns

**Backend:**
- **MVC Pattern**: Controllers handle requests, services contain business logic
- **Repository Pattern**: Database queries abstracted in services
- **Middleware Chain**: Auth, error handling, rate limiting
- **Async/Await**: All async operations use async/await pattern

**Frontend:**
- **Component-Based Architecture**: Reusable React components
- **Container/Presentational Pattern**: Pages as containers, components as presentational
- **Custom Hooks**: React Query for data fetching and state management
- **Context API**: AuthContext for global authentication state

---

## 3. File Structure

### Backend Files

```
backend/src/
├── controllers/
│   └── chat.js                 # Chat endpoint handlers
├── routes/
│   └── chat.js                 # Route definitions
├── services/
│   ├── aiService.js            # AI model integration (OpenAI/Anthropic)
│   └── vectorService.js        # Vector search operations
├── middleware/
│   ├── auth.js                 # JWT authentication
│   └── errorHandler.js         # Error handling utilities
└── index.js                    # App initialization, route mounting
```

### Frontend Files

```
frontend/src/
├── pages/
│   └── Chat.jsx                # Main chat interface
├── services/
│   └── api.js                  # API client and chat endpoints
└── context/
    └── AuthContext.jsx         # Authentication context
```

### Database Schema

```
shared/
└── init.sql                    # Initial schema with chat tables
```

### Entry Points

**Backend**: [backend/src/index.js](../backend/src/index.js#L56) - Chat routes mounted at `/api/chat`
```javascript
app.use('/api/chat', authMiddleware, chatRoutes);
```

**Frontend**: [frontend/src/pages/Chat.jsx](../frontend/src/pages/Chat.jsx#L1) - Main chat page component

---

## 4. API Endpoints

All chat endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### POST `/api/chat/quick`
**Purpose**: Ask a single question without creating a persistent session

**Request:**
```json
{
  "question": "What did I learn about React hooks?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What did I learn about React hooks?",
    "response": "Based on your memories, you learned...",
    "contextUsed": 3,
    "memories": [
      {
        "id": "uuid",
        "rawContent": "React hooks allow you to use state...",
        "similarity": 0.89
      }
    ]
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request (missing question)
- `401`: Unauthorized
- `500`: Server error

---

### POST `/api/chat/sessions`
**Purpose**: Create a new chat session

**Request:**
```json
{
  "title": "React Discussion"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "title": "React Discussion",
    "createdAt": "2026-01-23T10:30:00Z"
  }
}
```

**Status Codes:**
- `201`: Session created
- `401`: Unauthorized
- `500`: Server error

---

### GET `/api/chat/sessions`
**Purpose**: Get all chat sessions for the authenticated user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-uuid",
      "title": "React Discussion",
      "lastMessage": "That makes sense, thank you!",
      "messageCount": 12,
      "createdAt": "2026-01-23T10:30:00Z",
      "updatedAt": "2026-01-23T11:45:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

### GET `/api/chat/sessions/:sessionId`
**Purpose**: Get all messages for a specific session

**Query Parameters:**
- `limit` (optional): Maximum messages to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "messages": [
      {
        "id": "message-uuid",
        "role": "user",
        "content": "What are React hooks?",
        "context": [...],
        "createdAt": "2026-01-23T10:30:00Z"
      },
      {
        "id": "message-uuid",
        "role": "assistant",
        "content": "React hooks are functions that...",
        "context": [...],
        "createdAt": "2026-01-23T10:30:05Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Session not found

---

### POST `/api/chat/sessions/:sessionId/messages`
**Purpose**: Send a message in a chat session

**Request:**
```json
{
  "message": "How do I use useEffect?",
  "sessionId": "session-uuid",    // Optional, will create new if missing
  "contextLimit": 5               // Optional, default: 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "message": "How do I use useEffect?",
    "response": "useEffect is a React hook that...",
    "contextMemories": [
      {
        "id": "memory-uuid",
        "rawContent": "useEffect runs side effects...",
        "category": "Learning",
        "similarity": 0.92
      }
    ],
    "usage": {
      "prompt_tokens": 450,
      "completion_tokens": 120,
      "total_tokens": 570
    }
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid message format
- `401`: Unauthorized
- `500`: Server error

---

### DELETE `/api/chat/sessions/:sessionId`
**Purpose**: Delete a chat session and all its messages

**Response:**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Session not found

---

## 5. Database Schema

### Table: `chat_sessions`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique session identifier |
| `user_id` | UUID | FOREIGN KEY → users(id), ON DELETE CASCADE | Session owner |
| `title` | VARCHAR(255) | NULLABLE | Optional session title |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Session creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_chat_sessions_user` on `user_id`

**Triggers:**
- `update_chat_sessions_updated_at` - Auto-updates `updated_at` on row update

---

### Table: `chat_messages`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique message identifier |
| `session_id` | UUID | FOREIGN KEY → chat_sessions(id), ON DELETE CASCADE | Parent session |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('user', 'assistant', 'system') | Message sender role |
| `content` | TEXT | NOT NULL | Message content |
| `memory_context` | JSONB | NULLABLE | Array of memory objects used for context |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Message timestamp |

**Indexes:**
- `idx_chat_messages_session` on `session_id`

**Cascade Behavior:**
- When a session is deleted, all messages are automatically deleted

---

### Table: `memories` (Referenced)

The chat system queries the `memories` table for context retrieval:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Memory identifier |
| `raw_content` | TEXT | Original memory text |
| `category` | VARCHAR(100) | Memory category |
| `tags` | TEXT[] | Associated tags |
| `embedding` | VECTOR(1536) | Vector embedding for similarity search |

---

## 6. Frontend Components

### Component Hierarchy

```
Chat.jsx (Page)
├── Sessions Sidebar
│   ├── New Chat Button
│   └── Session List
│       └── Session Item
│           ├── Session Title
│           ├── Message Count
│           └── Delete Button
└── Chat Area
    ├── Empty State (when no session selected)
    ├── Messages List
    │   └── Message Bubble
    │       ├── Avatar (User/Bot)
    │       ├── Content
    │       └── Context Sources (optional)
    └── Message Input
        ├── Text Input
        └── Send Button
```

### Key Components

#### Chat.jsx (Main Component)
**Location**: [frontend/src/pages/Chat.jsx](../frontend/src/pages/Chat.jsx)

**Purpose**: Primary chat interface with session management and messaging

**State:**
```javascript
const [selectedSession, setSelectedSession] = useState(null)
const [message, setMessage] = useState('')
const [sessions, setSessions] = useState([])
```

**Key Queries:**
- `chatSessions`: Fetches all user sessions (polls every 10s)
- `chatMessages`: Fetches messages for selected session

**Key Mutations:**
- `sendMessageMutation`: Sends a message to the API
- `createSessionMutation`: Creates a new chat session
- `deleteSessionMutation`: Deletes a session

### State Management

**TanStack Query (React Query):**
- **Query Keys**: 
  - `['chatSessions']` - All user sessions
  - `['chatMessages', sessionId]` - Messages for specific session
- **Auto-refetching**: Sessions refetch every 10 seconds
- **Cache Invalidation**: Mutations invalidate relevant queries on success
- **Optimistic Updates**: None currently implemented

**Local State:**
- `selectedSession`: Currently active session
- `message`: Current input field value
- `sessions`: Local copy of sessions data

### Props/Interfaces

**Session Object:**
```typescript
interface Session {
  id: string;
  title: string | null;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

**Message Object:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context?: ContextMemory[];
  createdAt: string;
}
```

**Context Memory:**
```typescript
interface ContextMemory {
  id: string;
  rawContent: string;
  category: string;
  similarity: number;
}
```

### Routing

**Route**: `/chat` (defined in React Router)

**Navigation**: Accessed via main navigation menu in Layout component

---

## 7. Business Logic

### Core Functions

#### `chatController.sendMessage()`
**Location**: [backend/src/controllers/chat.js](../backend/src/controllers/chat.js#L8)

**Signature:**
```javascript
async sendMessage(req, res)
```

**Purpose**: Handles incoming chat messages, retrieves context, generates AI response

**Flow:**
1. Extract message, sessionId, contextLimit from request
2. Create new session if sessionId not provided
3. Search for relevant memories using vector similarity
4. Retrieve conversation history (last 20 messages)
5. Build message array with history and new message
6. Generate AI response with context
7. Save both user message and assistant response to database
8. Return response with context information

**Parameters:**
- `message` (string, required): User's message text
- `sessionId` (UUID, optional): Existing session ID or creates new
- `contextLimit` (number, optional, default: 5): Max memories to retrieve

---

#### `generateChatResponse()`
**Location**: [backend/src/services/aiService.js](../backend/src/services/aiService.js#L133)

**Signature:**
```javascript
async generateChatResponse(messages, context = [])
```

**Purpose**: Generates AI response using OpenAI or Anthropic models with memory context

**Flow:**
1. Check AI_PROVIDER environment variable (default: 'openai')
2. Build system prompt with context memories
3. Call appropriate AI service (OpenAI or Anthropic)
4. Return response content and token usage

**Parameters:**
- `messages` (Array): Chat history with {role, content} objects
- `context` (Array): Relevant memories for context augmentation

**Returns:**
```javascript
{
  content: string,      // AI response text
  usage: {              // Token usage stats
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

---

#### `vectorService.searchMemoriesByText()`
**Location**: [backend/src/services/vectorService.js](../backend/src/services/vectorService.js)

**Signature:**
```javascript
async searchMemoriesByText(text, options = {})
```

**Purpose**: Searches memories using vector similarity

**Flow:**
1. Generate embedding for input text using OpenAI
2. Query PostgreSQL with vector cosine similarity
3. Filter by threshold (default: 0.3)
4. Return top N results sorted by similarity

**Parameters:**
- `text` (string): Search query
- `options.limit` (number, default: 5): Max results
- `options.threshold` (number, default: 0.3): Minimum similarity score

---

### Validation Rules

**Message Validation:**
- Must be non-empty string
- Maximum length: Not explicitly enforced (limited by AI model context window)
- HTML/Script tags: No sanitization currently implemented ⚠️

**Session Validation:**
- Session ID must be valid UUID format
- User can only access their own sessions (enforced by SQL query)

**Context Limit:**
- Must be a number
- Parsed as integer
- No maximum enforced (practical limit: ~5-10 for token budget)

### Error Handling

**Custom Error Class:**
```javascript
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

**Error Wrapper:**
All controller methods wrapped in `asyncHandler()` which catches errors and passes to error middleware

**Error Responses:**
```javascript
{
  error: "Error title",
  message: "Detailed error message",
  stack: "..." // Only in development mode
}
```

**Common Errors:**
- 400: Invalid message format, missing required fields
- 401: Missing/invalid JWT token
- 404: Session not found or unauthorized access
- 500: AI service failures, database errors

### Side Effects

**External API Calls:**
1. **OpenAI API**:
   - `POST /v1/embeddings` - Generate text embeddings
   - `POST /v1/chat/completions` - Generate chat responses

2. **Anthropic API**:
   - `POST /v1/messages` - Generate chat responses (Claude)

**Database Operations:**
- INSERT: Saves user and assistant messages to `chat_messages`
- SELECT: Queries message history and memories
- DELETE: Cascade deletes messages when session deleted

**Logging:**
- Console logs for context search operations
- Morgan middleware logs all HTTP requests

---

## 8. Data Flow

### Request Lifecycle: Send Message

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                    │
│    User types message and clicks send in Chat.jsx                │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND API CALL                                              │
│    chatApi.sendMessage({ message, sessionId })                   │
│    axios POST /api/chat/sessions/:sessionId/messages             │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. MIDDLEWARE CHAIN                                               │
│    • Auth Middleware: Verify JWT, attach user to request         │
│    • Rate Limiter: Check request limits                          │
│    • Body Parser: Parse JSON body                                │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. ROUTE HANDLER                                                  │
│    routes/chat.js → chatController.sendMessage()                 │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. VECTOR SEARCH                                                  │
│    • Generate embedding for user message (OpenAI)                │
│    • vectorService.searchMemoriesByText()                        │
│    • PostgreSQL vector similarity search                         │
│    • Returns top 5 relevant memories                             │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. RETRIEVE HISTORY                                               │
│    • Query last 20 messages from chat_messages table             │
│    • Build conversation history array                            │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. AI GENERATION                                                  │
│    • Build system prompt with memory context                     │
│    • Combine history + new message                               │
│    • Call aiService.generateChatResponse()                       │
│    • OpenAI/Anthropic generates response                         │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. PERSIST TO DATABASE                                            │
│    • INSERT user message with context                            │
│    • INSERT assistant response with context                      │
│    • Update session updated_at (via trigger)                     │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 9. RESPONSE TO CLIENT                                             │
│    Return: { sessionId, message, response, contextMemories }     │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 10. FRONTEND UPDATE                                               │
│     • React Query invalidates cache                              │
│     • Messages re-fetched automatically                          │
│     • UI updates with new messages                               │
│     • Scroll to bottom                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Data Transformations

**1. User Input → Embedding**
```
"How do I use React hooks?" 
    → OpenAI embeddings API 
    → [0.123, -0.456, 0.789, ...] (1536 dimensions)
```

**2. Database Row → Memory Object**
```javascript
// Database row
{
  id: UUID,
  raw_content: "React hooks allow...",
  embedding: "[0.1, 0.2, ...]",
  tags: ["react", "hooks"]
}

// Formatted memory
{
  id: "uuid",
  rawContent: "React hooks allow...",
  tags: ["react", "hooks"],
  embedding: [0.1, 0.2, ...] // parsed from string
}
```

**3. Context Memories → System Prompt**
```javascript
const memories = [
  { raw_content: "React hooks allow you to use state...", category: "Learning" },
  { raw_content: "useEffect runs side effects...", category: "Reference" }
]

const prompt = `You are an AI assistant helping the user interact with their "Second Brain".

Here are some relevant memories from the user's Second Brain:
- React hooks allow you to use state... (Category: Learning, Tags: react, hooks)
- useEffect runs side effects... (Category: Reference, Tags: react, useEffect)`
```

### Third-party Integrations

**1. OpenAI API**
- **Purpose**: Text embeddings and chat completions
- **Endpoints**:
  - `POST /v1/embeddings` - Generate embeddings
  - `POST /v1/chat/completions` - Generate responses
- **Models**: 
  - `text-embedding-3-small` (embeddings)
  - `gpt-4o` (chat)
- **Rate Limits**: Based on OpenAI account tier
- **Error Handling**: Wrapped in try/catch, logged to console

**2. Anthropic API**
- **Purpose**: Alternative chat completions using Claude
- **Endpoints**:
  - `POST /v1/messages` - Generate responses
- **Models**: `claude-sonnet-4-20250514`
- **Configuration**: Enabled via `AI_PROVIDER=anthropic` env var

---

## 9. Configuration

### Environment Variables

**Required:**

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/second_brain

# AI Provider (openai or anthropic)
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# JWT Authentication
JWT_SECRET=your-super-secret-key
```

**Optional:**

```env
# Anthropic (if using Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# PostgreSQL (if using Docker)
POSTGRES_USER=secondbrain
POSTGRES_PASSWORD=your_password
POSTGRES_DB=second_brain
```

### Feature Flags

Currently no feature flags implemented. Potential additions:
- Chat history length
- Max context memories
- Enable/disable streaming responses

### Constants

**In chat controller:**
```javascript
const DEFAULT_CONTEXT_LIMIT = 5;
const MAX_HISTORY_MESSAGES = 20;
const SIMILARITY_THRESHOLD = 0.3;
```

**In AI service:**
```javascript
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_EMBEDDING_LENGTH = 8000; // characters
const TEMPERATURE = 0.7;
const MAX_TOKENS = 2048;
```

---

## 10. Security Considerations

### Authentication/Authorization

**JWT-based Authentication:**
- All chat endpoints require valid JWT token
- Token sent via `Authorization: Bearer <token>` header
- Middleware validates token and attaches user object to request
- Users can only access their own sessions (enforced via SQL WHERE clause)

**Token Validation:**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: decoded.userId, email: decoded.email };
```

### Input Sanitization

⚠️ **SECURITY GAPS IDENTIFIED:**

1. **No HTML/XSS Sanitization**: 
   - User messages are not sanitized before storage
   - Messages rendered in frontend without escaping
   - **Risk**: Cross-site scripting (XSS) attacks
   - **Recommendation**: Use DOMPurify or similar sanitization library

2. **No SQL Injection Protection for Vector Search**:
   - Vector service uses raw embedding values
   - **Mitigation**: PostgreSQL parameterized queries used throughout

3. **No Rate Limiting on Chat Endpoints**:
   - General rate limiter (100 req/15min) on all /api routes
   - **Recommendation**: Add specific chat rate limiting

### Sensitive Data Handling

**API Keys:**
- Stored in environment variables (not in code)
- Never logged or exposed in responses
- Usage tracking exposed in response (token counts)

**User Data:**
- Messages stored with session context
- User can only access own sessions
- No encryption at rest (PostgreSQL default)

**AI Context:**
- Memory context sent to third-party APIs (OpenAI/Anthropic)
- ⚠️ **Risk**: Sensitive information may be sent to external services
- **Recommendation**: Add option to exclude certain memories from AI context

### CORS Configuration

```javascript
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
})
```

- Restricts requests to specific frontend URL
- Credentials enabled for JWT cookies (if used)

---

## 11. Testing

### Test Files

⚠️ **NO TESTS CURRENTLY IMPLEMENTED**

Recommended test structure:
```
backend/src/__tests__/
├── controllers/
│   └── chat.test.js
├── services/
│   ├── aiService.test.js
│   └── vectorService.test.js
└── integration/
    └── chat.api.test.js
```

### Coverage Analysis

**What Needs Testing:**

1. **Unit Tests:**
   - [ ] `chatController.sendMessage()` - Mock DB and AI service
   - [ ] `chatController.quickQuestion()` - Single-turn flow
   - [ ] `generateChatResponse()` - Mock OpenAI/Anthropic
   - [ ] `searchMemoriesByText()` - Mock embedding generation

2. **Integration Tests:**
   - [ ] Full chat flow: message → context retrieval → AI response
   - [ ] Session management: create, list, delete
   - [ ] Authentication failures
   - [ ] Rate limiting enforcement

3. **Frontend Tests:**
   - [ ] Message send/receive flow
   - [ ] Session creation and selection
   - [ ] Auto-scrolling behavior
   - [ ] Error state handling

### Test Commands

```bash
# Backend tests (Jest configured but no tests written)
cd backend
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## 12. Known Issues & Limitations

### Technical Debt

1. **No Input Sanitization**
   - Messages stored and displayed without XSS protection
   - **Priority**: HIGH
   - **Effort**: Medium (integrate DOMPurify)

2. **No Message Streaming**
   - AI responses are fully generated before display
   - Users wait for complete response (can be 5-10 seconds)
   - **Priority**: Medium
   - **Effort**: High (requires SSE or WebSocket implementation)

3. **Session Title Not Auto-Generated**
   - Sessions created with generic titles or null
   - **Priority**: Low
   - **Effort**: Low (use first message as title)

4. **No Message Editing/Deletion**
   - Once sent, messages cannot be modified
   - **Priority**: Low
   - **Effort**: Medium

5. **Limited Error Messages to User**
   - Generic "Something went wrong" messages
   - **Priority**: Low
   - **Effort**: Low

### Edge Cases

1. **Very Long Messages**
   - No character limit enforced
   - Could exceed AI model context window
   - **Mitigation**: Add frontend character counter and validation

2. **Too Many Context Memories**
   - High `contextLimit` could exceed token budget
   - **Mitigation**: Cap at reasonable limit (10-15)

3. **Empty Session History**
   - First message in session has no history
   - Handled correctly but could improve prompting

4. **Concurrent Message Sending**
   - No locking mechanism prevents race conditions
   - User could send multiple messages simultaneously
   - **Risk**: Message order confusion

### Performance Concerns

1. **Vector Search Latency**
   - Each message requires embedding generation (~200-500ms)
   - Plus vector similarity search (~100-300ms)
   - **Total overhead**: ~500ms per message
   - **Optimization**: Cache embeddings for common queries

2. **AI Response Time**
   - GPT-4 responses: 3-8 seconds typical
   - Claude responses: 2-6 seconds typical
   - **Mitigation**: Implement streaming responses

3. **Message History Query**
   - Fetches last 20 messages per request
   - Could be slow for large sessions
   - **Optimization**: Add pagination, limit history size

4. **Session Polling**
   - Frontend polls sessions every 10 seconds
   - Unnecessary if user isn't actively chatting
   - **Optimization**: Use WebSocket for real-time updates

---

## 13. Development Guide

### Setup Steps

1. **Prerequisites:**
   ```bash
   # Ensure Docker and Docker Compose installed
   docker --version
   docker-compose --version
   ```

2. **Environment Configuration:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys
   nano .env
   ```

3. **Start Development Services:**
   ```bash
   # From project root
   docker-compose up -d postgres
   
   # Wait for PostgreSQL to be ready
   docker-compose logs -f postgres
   ```

4. **Initialize Database:**
   ```bash
   cd backend
   npm run db:migrate
   ```

5. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm run dev  # Starts with nodemon
   ```

6. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev  # Starts Vite dev server
   ```

7. **Access Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health

### Common Tasks

#### Add a New Chat Endpoint

1. **Define route** in [backend/src/routes/chat.js](../backend/src/routes/chat.js):
   ```javascript
   router.post('/my-endpoint', chatController.myNewEndpoint);
   ```

2. **Add controller method** in [backend/src/controllers/chat.js](../backend/src/controllers/chat.js):
   ```javascript
   myNewEndpoint: asyncHandler(async (req, res) => {
     // Your logic here
     res.json({ success: true, data: {...} });
   })
   ```

3. **Add API client method** in [frontend/src/services/api.js](../frontend/src/services/api.js):
   ```javascript
   export const chatApi = {
     // ... existing methods
     myNewFeature: (data) => api.post('/chat/my-endpoint', data)
   }
   ```

#### Modify AI System Prompt

Edit [backend/src/services/aiService.js](../backend/src/services/aiService.js#L150):
```javascript
const systemPrompt = `You are an AI assistant...
[Modify your prompt here]
`;
```

#### Change Context Retrieval Logic

Modify [backend/src/controllers/chat.js](../backend/src/controllers/chat.js#L23):
```javascript
const contextMemories = await vectorService.searchMemoriesByText(message, {
  limit: parseInt(contextLimit),
  threshold: 0.3  // Adjust similarity threshold
});
```

### Debugging Tips

**Common Issue: Chat Not Loading**
```bash
# Check backend is running
curl http://localhost:3001/health

# Check auth token in browser console
localStorage.getItem('token')

# Check network tab for failed requests
```

**Common Issue: AI Not Responding**
```bash
# Check environment variables
echo $OPENAI_API_KEY

# Check backend logs
docker-compose logs -f backend

# Test OpenAI connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Common Issue: No Context Memories Found**
```bash
# Check if memories exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM memories;"

# Check if embeddings exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL;"

# Test vector search directly
psql $DATABASE_URL -c "
  SELECT id, raw_content, embedding <=> '[0.1, 0.2, ...]' as distance 
  FROM memories 
  ORDER BY distance 
  LIMIT 5;
"
```

**Enable Detailed Logging**

Add to [backend/src/controllers/chat.js](../backend/src/controllers/chat.js):
```javascript
console.log('[DEBUG] Message:', message);
console.log('[DEBUG] Context memories:', contextMemories);
console.log('[DEBUG] AI response:', response);
```

---

## 14. Future Enhancements

### Planned Features

1. **Message Streaming** ⭐ Priority
   - Implement Server-Sent Events (SSE) for real-time streaming
   - Show AI response as it's generated
   - Estimated effort: 2-3 days

2. **Session Titles Auto-Generation**
   - Use first message to generate session title via AI
   - Update title after first exchange
   - Estimated effort: 4 hours

3. **Message Reactions**
   - Allow users to 👍/👎 messages
   - Use feedback for prompt tuning
   - Estimated effort: 1 day

4. **Export Chat History**
   - Export sessions as Markdown or PDF
   - Include context sources
   - Estimated effort: 1 day

5. **Voice Input**
   - Use browser Web Speech API
   - Convert speech to text for messaging
   - Estimated effort: 2 days

### Potential Improvements

**Performance:**
- Implement response caching for similar questions
- Use lighter embedding model for faster search
- Add connection pooling for PostgreSQL
- Implement message pagination for large sessions

**UX:**
- Add typing indicators
- Show token usage warnings before expensive queries
- Implement message search within sessions
- Add keyboard shortcuts (Cmd+K to focus input)

**Features:**
- Support for image/file attachments
- Code syntax highlighting in messages
- Collaborative sessions (multiple users)
- AI model selection in UI (GPT-4 vs Claude)
- Custom system prompts per session
- Pin important messages

**Developer Experience:**
- Add API documentation with Swagger/OpenAPI
- Implement comprehensive test suite
- Add database seeding scripts for development
- Create Postman collection for API testing

---

## Questions to Complete Documentation

1. **Are there any plans to implement streaming responses?**
   - If yes, SSE or WebSocket?
   - Timeline?

2. **What is the expected concurrent user load?**
   - Affects rate limiting and caching strategies

3. **Are there privacy requirements for message data?**
   - Should messages be encrypted at rest?
   - Data retention policies?

4. **Should users be able to share chat sessions?**
   - Public links to sessions?
   - Read-only access for collaborators?

5. **Is there a budget limit for AI API calls?**
   - Should there be per-user token limits?
   - Cost tracking and alerts?

6. **Are there plans to support other AI models?**
   - Local models (LLaMA, Mistral)?
   - Different OpenAI models (GPT-3.5 for cost savings)?

7. **Should the system support multiple languages?**
   - i18n for UI?
   - Multilingual memory search?

---

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Maintained By**: Development Team
