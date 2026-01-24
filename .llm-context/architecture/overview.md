# System Architecture - Second Brain AI

## High-Level Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                         User Interfaces                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐           │
│  │  Slack   │        │ Browser  │        │   n8n    │           │
│  │ Messages │        │  (SPA)   │        │ Workflows│           │
│  └────┬─────┘        └────┬─────┘        └────┬─────┘           │
│       │                   │                   │                  │
└───────┼───────────────────┼───────────────────┼──────────────────┘
        │                   │                   │
        │                   │                   │
┌───────▼───────────────────▼───────────────────▼──────────────────┐
│                      Application Layer                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               n8n Workflow Engine                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │Slack Webhook │→ │  Transform   │→ │  POST to API │  │    │
│  │  │   Trigger    │  │   Extract    │  │   /webhook   │  │    │
│  │  └──────────────┘  └──────────────┘  └──────┬───────┘  │    │
│  └────────────────────────────────────────────┬─┴──────────┘    │
│                                               │                  │
│  ┌────────────────────────────────────────────▼─────────────┐   │
│  │           Express REST API (Node.js)                      │   │
│  │                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │   Routes     │  │ Middleware   │  │ Controllers  │   │   │
│  │  │              │  │              │  │              │   │   │
│  │  │ /auth        │  │ JWT Auth     │  │ memories     │   │   │
│  │  │ /memories    │  │ Rate Limit   │  │ search       │   │   │
│  │  │ /search      │  │ Error Handle │  │ chat         │   │   │
│  │  │ /chat        │  │ CORS         │  │ llmSettings  │   │   │
│  │  │ /webhook     │  │ Helmet       │  │ auth         │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │   │
│  │         │                 │                 │            │   │
│  │         └─────────────────┴─────────────────┘            │   │
│  │                           │                              │   │
│  │  ┌────────────────────────▼────────────────────────┐    │   │
│  │  │          Service Layer                          │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │   │
│  │  │  │aiService │  │  vector  │  │  ollama  │     │    │   │
│  │  │  │          │  │ Service  │  │ Service  │     │    │   │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘     │    │   │
│  │  └───────┼─────────────┼─────────────┼───────────┘    │   │
│  └──────────┼─────────────┼─────────────┼────────────────┘   │
└─────────────┼─────────────┼─────────────┼────────────────────┘
              │             │             │
┌─────────────▼─────────────▼─────────────▼────────────────────┐
│                    Data & Integration Layer                   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────┐  ┌──────────────┐ │
│  │     PostgreSQL 16 + pgvector         │  │  External    │ │
│  │                                      │  │  LLM APIs    │ │
│  │  ┌─────────────┐  ┌───────────────┐ │  │              │ │
│  │  │   Tables    │  │   Indexes     │ │  │ ┌──────────┐ │ │
│  │  │             │  │               │ │  │ │ OpenAI   │ │ │
│  │  │ users       │  │ IVFFlat       │ │  │ │ API      │ │ │
│  │  │ memories    │  │ (vector)      │ │  │ └──────────┘ │ │
│  │  │ categories  │  │ GIN (tags)    │ │  │              │ │
│  │  │ chat_*      │  │ B-tree        │ │  │ ┌──────────┐ │ │
│  │  │ llm_*       │  │               │ │  │ │Anthropic │ │ │
│  │  └─────────────┘  └───────────────┘ │  │ │ Claude   │ │ │
│  │                                      │  │ └──────────┘ │ │
│  │  Embedding: VECTOR(1536)             │  │              │ │
│  │  Full-text: JSONB, TEXT[]            │  │ ┌──────────┐ │ │
│  └──────────────────────────────────────┘  │ │  Ollama  │ │ │
│                                             │ │  (Local) │ │ │
│                                             │ └──────────┘ │ │
│                                             └──────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer (React SPA)
**Technology**: React 18.3.1 + Vite 5.3.1  
**Purpose**: User interface for interacting with memories, chat, and search  
**Port**: 5173 (development)

**Key Features**:
- Single Page Application with React Router v6
- Real-time search with TanStack Query
- Responsive UI with Tailwind CSS
- JWT-based authentication
- WebSocket-ready for future real-time features

### 2. Backend API Layer (Express)
**Technology**: Node.js + Express 4.19.2  
**Purpose**: REST API serving all client requests  
**Port**: 3001

**Key Features**:
- RESTful API with JSON responses
- JWT authentication middleware
- Rate limiting (100 req/15min per IP)
- Security headers (Helmet)
- CORS configuration
- Error handling middleware

### 3. Workflow Automation (n8n)
**Technology**: n8n workflow engine  
**Purpose**: Automate Slack message capture  
**Port**: 5678

**Key Features**:
- Webhook triggers from Slack
- Data transformation
- API integration with backend
- Visual workflow builder

### 4. Database Layer (PostgreSQL + pgvector)
**Technology**: PostgreSQL 16 with pgvector extension  
**Purpose**: Persistent data storage + vector search  
**Port**: 5432

**Key Features**:
- Relational data model
- Vector embeddings (1536 dimensions)
- Full-text search
- JSONB for flexible schemas
- Automatic timestamps and triggers

### 5. AI Services Layer
**Technology**: OpenAI SDK, Anthropic SDK, Ollama  
**Purpose**: LLM integration for embeddings, classification, chat

**Providers**:
- **OpenAI**: GPT-4o, GPT-4, text-embedding-3-small
- **Anthropic**: Claude Sonnet 4
- **Ollama**: Local LLMs (llama3.2, etc.)

## Request Flow

### 1. User Creates Memory via Frontend
```
User (Browser) → Frontend (React)
    ↓
POST /api/memories
    ↓
Express Router → Auth Middleware → Controller
    ↓
aiService.classifyAndStructure(content)
    ↓
LLM Provider (OpenAI/Claude/Ollama) → Returns structured data
    ↓
aiService.generateEmbedding(content)
    ↓
OpenAI Embeddings API → Returns vector [1536]
    ↓
Controller saves to PostgreSQL (memories table)
    ↓
Response → Frontend updates UI
```

### 2. Slack Message Capture
```
Slack Event → n8n Webhook Trigger
    ↓
n8n Transform Node (extract text, user, timestamp)
    ↓
POST /api/webhook → Express API
    ↓
Auth Middleware (validate n8n signature)
    ↓
aiService.classifyAndStructure(message)
    ↓
aiService.generateEmbedding(message)
    ↓
Save to memories table
    ↓
Response 200 OK → n8n logs success
```

### 3. Semantic Search
```
User Query → Frontend
    ↓
POST /api/search/semantic
    ↓
Controller receives query text
    ↓
vectorService.generateEmbedding(query)
    ↓
PostgreSQL vector similarity search
SELECT * FROM memories
ORDER BY embedding <=> $1::vector
LIMIT 20
    ↓
Results ranked by cosine similarity
    ↓
Response → Frontend displays results
```

### 4. RAG Chat
```
User Message → Frontend
    ↓
POST /api/chat/quick (or /sessions/{id}/messages)
    ↓
Controller receives message
    ↓
vectorService.searchSimilar(message) → Top 5 memories
    ↓
aiService.generateChatResponse(
  messages: [user message],
  context: [relevant memories]
)
    ↓
LLM Provider (with RAG context) → Response
    ↓
Save to chat_messages table
    ↓
Response → Frontend displays in chat UI
```

## Key Design Decisions

### Why Next.js Was NOT Chosen?
- **Separation of Concerns**: React SPA + Express API allows independent scaling
- **Flexibility**: Can deploy frontend and backend separately
- **n8n Integration**: Dedicated backend makes webhook handling cleaner

### Why PostgreSQL + pgvector?
- **Vector Search**: Native pgvector extension for cosine similarity
- **Relational Model**: Complex relationships (users, memories, chats)
- **ACID Compliance**: Data integrity for auth and chat history
- **JSON Support**: JSONB for flexible AI-structured content

### Why ES Modules in Backend?
- **Modern JavaScript**: import/export syntax
- **Future-proof**: Native Node.js support
- **Cleaner Code**: No require() overhead

### Why Zustand over Redux?
- **Simplicity**: Less boilerplate
- **Performance**: Re-render optimization built-in
- **Small Bundle**: Lightweight state management

### Why Multiple LLM Providers?
- **Flexibility**: Users choose based on cost/privacy
- **Fallback**: If one provider fails, switch to another
- **Local Option**: Ollama for completely private deployments

### Why TanStack Query?
- **Caching**: Automatic request deduplication
- **Optimistic Updates**: Better UX
- **Background Refetching**: Keep data fresh

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Backend validates via bcrypt
3. JWT token generated (24h expiry)
4. Token stored in localStorage (client)
5. Token sent in Authorization header
6. Middleware validates JWT on each request
7. User ID extracted from token for queries
```

### Security Layers
1. **Helmet**: Security headers (XSS, CSP, etc.)
2. **CORS**: Whitelist allowed origins
3. **Rate Limiting**: Prevent brute force
4. **bcrypt**: Password hashing (10 rounds)
5. **JWT**: Stateless authentication
6. **Environment Variables**: Secrets never in code

## Scalability Considerations

### Current Limitations
- Single PostgreSQL instance (no replication)
- In-memory rate limiting (loses state on restart)
- No caching layer (Redis could be added)
- Synchronous LLM calls (could use queues)

### Future Enhancements
- **Redis**: Caching + distributed rate limiting
- **Queue System**: Bull/BullMQ for async LLM jobs
- **Read Replicas**: PostgreSQL replication
- **CDN**: Static asset delivery
- **Load Balancer**: Multiple backend instances

## Data Flow Summary

```
Input Sources → Processing → Storage → Retrieval → Output
─────────────   ──────────   ───────   ─────────   ──────
Slack          AI Classify   memories   Semantic    Web UI
Manual UI      Embeddings    users      Search      Chat
n8n Webhook    Validation    chat_*     SQL Query   API
                                        Vector      Export
```

## Technology Choices Summary

| Decision | Technology | Reason |
|----------|-----------|--------|
| **Frontend** | React + Vite | Fast dev, modern tooling |
| **Backend** | Express | Simple, flexible, Node.js |
| **Database** | PostgreSQL | Vector support, reliability |
| **Vector Search** | pgvector | Native PG extension |
| **Auth** | JWT | Stateless, scalable |
| **State** | Zustand | Lightweight, simple |
| **Server State** | TanStack Query | Caching, optimistic updates |
| **Styling** | Tailwind CSS | Utility-first, fast iteration |
| **AI** | Multi-provider | Flexibility, cost optimization |
| **Automation** | n8n | Visual, extensible |
| **Deployment** | Docker Compose | Easy self-hosting |

---

**Last Updated**: 2026-01-24  
**Diagram Version**: 1.0  
**Status**: Production-ready architecture
