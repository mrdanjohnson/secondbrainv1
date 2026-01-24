# Data Flow - Second Brain AI System

## Overview

This document describes how data moves through the Second Brain system, from capture to retrieval, including all transformations and integrations along the way.

---

## Primary Data Flows

### Flow 1: Slack → Memory Creation (Automated Capture)

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Capture                                            │
└─────────────────────────────────────────────────────────────┘

Slack Workspace
    │ User posts message in monitored channel
    │
    ▼
Slack Event Webhook
    │ Sends JSON payload with:
    │ - message text
    │ - timestamp  
    │ - user info
    │ - channel info
    │
    ▼
n8n Workflow Trigger
    │ 1. Receives webhook
    │ 2. Validates Slack signature
    │ 3. Extracts text content
    │ 4. Transforms to API format
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Processing                                         │
└─────────────────────────────────────────────────────────────┘

POST /api/webhook
    │ Headers: { Authorization: "Bearer <n8n-token>" }
    │ Body: { 
    │   content: "message text",
    │   source: "slack",
    │   slack_message_ts: "1234567890.123"
    │ }
    │
    ▼
Express Middleware Chain
    │ 1. Helmet (security headers)
    │ 2. CORS check
    │ 3. Rate limiter (100/15min)
    │ 4. Auth validation (JWT)
    │ 5. Error handler (catch all)
    │
    ▼
Webhook Controller
    │ 1. Receives request
    │ 2. Validates payload
    │ 3. Calls aiService.classifyAndStructure()
    │
    ▼
AI Service - Classification
    │ 1. Checks user LLM settings (provider, model)
    │ 2. Constructs classification prompt
    │ 3. Calls LLM API (OpenAI/Claude/Ollama)
    │
    ▼
LLM Provider (e.g., OpenAI GPT-4o)
    │ Input: Raw text
    │ Output: {
    │   summary: "Brief summary",
    │   category: "Idea",
    │   tags: ["innovation", "product"],
    │   sentiment: "positive",
    │   priority: "medium",
    │   entities: ["John", "Q4 2024"]
    │ }
    │
    ▼
AI Service - Embedding Generation
    │ 1. Takes original text
    │ 2. Calls embeddings API
    │ 3. Returns vector array [1536 dimensions]
    │
    ▼
OpenAI Embeddings API
    │ Model: text-embedding-3-small
    │ Input: "message text"
    │ Output: [0.123, -0.456, 0.789, ... ] (1536 floats)
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Storage                                            │
└─────────────────────────────────────────────────────────────┘

PostgreSQL INSERT
    │ INSERT INTO memories (
    │   id,                    -- UUID (auto-generated)
    │   raw_content,           -- Original text
    │   structured_content,    -- JSONB from classification
    │   category,              -- "Idea"
    │   tags,                  -- TEXT[] array
    │   embedding,             -- VECTOR(1536)
    │   source,                -- "slack"
    │   slack_message_ts,      -- "1234567890.123"
    │   created_at,            -- NOW()
    │   updated_at             -- NOW()
    │ )
    │
    ▼
Database Triggers
    │ 1. update_updated_at_column() fires before UPDATE
    │ 2. Indexes updated:
    │    - idx_memories_category (B-tree)
    │    - idx_memories_tags (GIN)
    │    - idx_memories_embedding (IVFFlat)
    │    - idx_memories_created_at (B-tree DESC)
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Response                                           │
└─────────────────────────────────────────────────────────────┘

HTTP 201 Created
    │ {
    │   success: true,
    │   data: {
    │     id: "uuid-here",
    │     raw_content: "...",
    │     category: "Idea",
    │     tags: [...],
    │     created_at: "2026-01-24T..."
    │   }
    │ }
    │
    ▼
n8n Logs Success
```

---

### Flow 2: Manual Memory Creation (Frontend UI)

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: User Input                                         │
└─────────────────────────────────────────────────────────────┘

React UI (CreateMemoryModal)
    │ User types content in textarea
    │ User clicks "Save Memory"
    │
    ▼
Frontend Validation
    │ - Check content not empty
    │ - Min length validation
    │
    ▼
API Service (Axios)
    │ POST /api/memories
    │ Headers: { 
    │   Authorization: "Bearer <jwt-token>",
    │   Content-Type: "application/json"
    │ }
    │ Body: { raw_content: "user text" }
    │
    ▼

[... Same as Flow 1 from "Express Middleware Chain" onward ...]

    ▼
React Query (TanStack)
    │ 1. Receives response
    │ 2. Updates cache
    │ 3. Invalidates "memories" query
    │ 4. Triggers refetch
    │
    ▼
UI Update
    │ 1. Modal closes
    │ 2. Success toast notification
    │ 3. Memory appears in list
```

---

### Flow 3: Semantic Search

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Query Input                                        │
└─────────────────────────────────────────────────────────────┘

React Search Page
    │ User types query: "ideas about product innovation"
    │ User clicks "Search" or presses Enter
    │
    ▼
Frontend Debounce (300ms)
    │ Prevents API spam on every keystroke
    │
    ▼
POST /api/search/semantic
    │ Headers: { Authorization: "Bearer <jwt>" }
    │ Body: { 
    │   query: "ideas about product innovation",
    │   limit: 20,
    │   threshold: 0.3  // Min similarity score
    │ }
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Vector Generation                                  │
└─────────────────────────────────────────────────────────────┘

Search Controller
    │ 1. Extract query from request
    │ 2. Call vectorService.generateEmbedding(query)
    │
    ▼
AI Service - Embedding
    │ Same as memory creation embedding process
    │ Calls OpenAI embeddings API
    │ Returns query vector [1536]
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Vector Similarity Search                           │
└─────────────────────────────────────────────────────────────┘

PostgreSQL Query
    │ SELECT 
    │   id,
    │   raw_content,
    │   category,
    │   tags,
    │   created_at,
    │   1 - (embedding <=> $1::vector) AS similarity
    │ FROM memories
    │ WHERE 1 - (embedding <=> $1::vector) > $2
    │ ORDER BY embedding <=> $1::vector
    │ LIMIT $3
    │
    │ Parameters:
    │   $1 = query vector [1536]
    │   $2 = 0.3 (threshold)
    │   $3 = 20 (limit)
    │
    ▼
pgvector IVFFlat Index
    │ 1. Uses vector index for fast similarity search
    │ 2. Cosine distance operator: <=>
    │ 3. Returns top K nearest neighbors
    │
    ▼
Result Set
    │ [
    │   { id: "...", similarity: 0.89, raw_content: "..." },
    │   { id: "...", similarity: 0.76, raw_content: "..." },
    │   { id: "...", similarity: 0.65, raw_content: "..." },
    │   ...
    │ ]
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Response & Display                                 │
└─────────────────────────────────────────────────────────────┘

HTTP 200 OK
    │ {
    │   results: [...memories with similarity scores],
    │   query: "ideas about product innovation",
    │   count: 15
    │ }
    │
    ▼
React UI Update
    │ 1. Display results sorted by similarity
    │ 2. Show similarity percentage
    │ 3. Highlight matching categories/tags
```

---

### Flow 4: RAG Chat Conversation

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: User Message                                       │
└─────────────────────────────────────────────────────────────┘

React Chat Page
    │ User types: "What are my recent ideas?"
    │ User clicks Send
    │
    ▼
POST /api/chat/quick
    │ (OR: POST /api/chat/sessions/{id}/messages for persistent)
    │ 
    │ Headers: { Authorization: "Bearer <jwt>" }
    │ Body: {
    │   message: "What are my recent ideas?",
    │   sessionId: "uuid" (optional for persistent chat)
    │ }
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Context Retrieval (RAG)                            │
└─────────────────────────────────────────────────────────────┘

Chat Controller
    │ 1. Generate embedding for user message
    │ 2. Call vectorService.searchSimilar(message, 5)
    │    - Returns top 5 most relevant memories
    │    - Uses same vector search as Flow 3
    │
    ▼
Memory Context Retrieved
    │ [
    │   { similarity: 0.92, raw_content: "Build AI product...", category: "Idea" },
    │   { similarity: 0.87, raw_content: "ML model idea...", category: "Idea" },
    │   { similarity: 0.81, raw_content: "Innovation framework...", category: "Idea" },
    │   { similarity: 0.76, raw_content: "Product strategy...", category: "Project" },
    │   { similarity: 0.71, raw_content: "Brainstorm notes...", category: "Meeting" }
    │ ]
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: LLM Response Generation                            │
└─────────────────────────────────────────────────────────────┘

AI Service - Generate Chat Response
    │ 1. Get user's LLM settings (provider, model, temp)
    │ 2. Construct system prompt with RAG context
    │ 3. Add conversation history (if session exists)
    │ 4. Call LLM API
    │
    ▼
System Prompt (with RAG context)
    │ "You are an AI assistant helping the user interact 
    │  with their 'Second Brain' knowledge management system.
    │  
    │  Here are relevant memories (with similarity scores):
    │  - [92%] Build AI product...
    │  - [87%] ML model idea...
    │  - [81%] Innovation framework...
    │  
    │  Answer based on this context..."
    │
    ▼
LLM Provider (e.g., GPT-4o)
    │ Input: System prompt + user message + history
    │ Output: "Based on your memories, you have several 
    │          recent AI-related ideas including..."
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Persistence & Response                             │
└─────────────────────────────────────────────────────────────┘

Save to Database (if session exists)
    │ INSERT INTO chat_messages (
    │   session_id,
    │   role,           -- "user"
    │   content,        -- User's message
    │   memory_context  -- JSONB array of relevant memories
    │ )
    │
    │ INSERT INTO chat_messages (
    │   session_id,
    │   role,           -- "assistant"
    │   content,        -- LLM response
    │   memory_context  -- Same context
    │ )
    │
    │ UPDATE chat_sessions SET updated_at = NOW()
    │
    ▼
HTTP 200 OK
    │ {
    │   response: "Based on your memories...",
    │   context: [...memory excerpts],
    │   usage: { prompt_tokens: 456, completion_tokens: 123 }
    │ }
    │
    ▼
React Chat UI Update
    │ 1. Display assistant message
    │ 2. Show context sources (expandable)
    │ 3. Update token usage counter
```

---

### Flow 5: User Authentication

```
┌─────────────────────────────────────────────────────────────┐
│ Login Flow                                                  │
└─────────────────────────────────────────────────────────────┘

Login Page (React)
    │ User enters email + password
    │ Clicks "Sign In"
    │
    ▼
POST /api/auth/login
    │ Body: { email, password }
    │
    ▼
Auth Controller
    │ 1. Query users table by email
    │ 2. If not found → 401 Unauthorized
    │ 3. Compare password with bcrypt
    │ 4. If mismatch → 401 Unauthorized
    │ 5. Generate JWT token
    │
    ▼
JWT Generation
    │ Payload: {
    │   userId: "uuid",
    │   email: "user@example.com",
    │   iat: 1234567890,
    │   exp: 1234654290  // 24 hours later
    │ }
    │ Sign with process.env.JWT_SECRET
    │
    ▼
HTTP 200 OK
    │ {
    │   token: "eyJhbGciOiJIUzI1NiIs...",
    │   user: { id, email, name }
    │ }
    │
    ▼
Frontend Storage
    │ 1. localStorage.setItem('token', token)
    │ 2. Update Zustand auth store
    │ 3. Redirect to /dashboard
    │
    ▼

┌─────────────────────────────────────────────────────────────┐
│ Subsequent Requests                                         │
└─────────────────────────────────────────────────────────────┘

Every API Call
    │ Headers: { 
    │   Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
    │ }
    │
    ▼
Auth Middleware
    │ 1. Extract token from header
    │ 2. Verify with jwt.verify(token, JWT_SECRET)
    │ 3. If invalid/expired → 401 Unauthorized
    │ 4. Extract userId from payload
    │ 5. Attach to req.user for controllers
    │
    ▼
Controller Access
    │ const userId = req.user.id;
    │ // Use for database queries
```

---

## Data Transformations Summary

| Stage | Input | Transformation | Output |
|-------|-------|----------------|--------|
| **Slack Capture** | Message text | n8n extraction | Clean text + metadata |
| **AI Classification** | Raw text | LLM analysis | Structured JSON (category, tags, etc.) |
| **Embedding** | Text string | OpenAI API | Vector [1536] floats |
| **Storage** | Multiple fields | SQL INSERT | Database row |
| **Search** | Query text | Embedding + pgvector | Ranked results by similarity |
| **RAG Context** | User question | Vector search | Top 5 relevant memories |
| **Chat Response** | Question + context | LLM generation | Natural language answer |

---

## Data Quality & Validation

### Input Validation
- **Text Length**: 1-10,000 characters
- **Email**: RFC 5322 compliant
- **JWT**: Valid signature, not expired
- **Vector**: Exactly 1536 dimensions

### Data Enrichment
- **Auto Timestamps**: created_at, updated_at (triggers)
- **UUIDs**: Auto-generated for all primary keys
- **Default Values**: category = "Unsorted", source = "slack"

### Error Handling
- **LLM Failures**: Retry 3x with exponential backoff
- **DB Constraints**: Catch unique violations, return 409 Conflict
- **Network Errors**: Return 503 Service Unavailable

---

**Last Updated**: 2026-01-24  
**Status**: Production data flows documented
