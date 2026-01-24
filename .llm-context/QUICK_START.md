# Quick Start - Second Brain AI System

## 🎯 Current Focus (Updated: 2026-01-24)

**Active Sprint**: Documentation & AI Context System  
**Status**: Implementing comprehensive .llm-context documentation toolbox

## 📊 Project Status

### Recently Completed
- ✅ Core RAG chat functionality with multi-session support
- ✅ LLM provider configuration (OpenAI, Anthropic, Ollama)
- ✅ Semantic search with pgvector
- ✅ n8n Slack integration for automated capture
- ✅ JWT authentication system
- ✅ Database migration system

### Currently In Progress
- 🔄 AI coding agent documentation system (.llm-context/)
- 🔄 Comprehensive API documentation
- 🔄 Component registry and style guides

### Next Up
- ⏳ Enhanced testing coverage
- ⏳ Performance monitoring
- ⏳ Advanced vector search optimizations

## 🏗️ System Architecture (Quick Reference)

```
┌─────────────┐
│    Slack    │
└──────┬──────┘
       │
       ↓
┌─────────────┐     ┌──────────────┐
│     n8n     │────→│  Backend API │
│  Workflows  │     │  (Express)   │
└─────────────┘     └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    ↓             ↓
              ┌──────────┐  ┌──────────────┐
              │PostgreSQL│  │  LLM Providers│
              │+pgvector │  │ (OpenAI/Claude)│
              └──────────┘  └──────────────┘
                    ↑
                    │
              ┌─────────────┐
              │   Frontend  │
              │   (React)   │
              └─────────────┘
```

## 🔑 Key Technologies

| Component | Technology | Port/Access |
|-----------|-----------|-------------|
| Frontend | React 18 + Vite | http://localhost:5173 |
| Backend | Express + Node.js | http://localhost:3001 |
| Database | PostgreSQL 16 + pgvector | localhost:5432 |
| Automation | n8n | http://localhost:5678 |
| AI (Optional) | Ollama | http://localhost:11434 |

## 📝 Essential Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://secondbrain:password@db:5432/secondbrain
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://ollama:11434

# n8n (.env)
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
WEBHOOK_URL=http://n8n:5678/webhook/
```

## 🚀 Common Commands

### Development
```bash
# Start all services
docker-compose up -d

# Backend development
cd backend
npm run dev              # Start with nodemon
npm run db:migrate       # Apply migrations
npm run db:status        # Check migration status

# Frontend development
cd frontend
npm run dev              # Start Vite dev server
npm run build            # Production build

# Database
docker-compose exec db psql -U secondbrain -d secondbrain
```

### Database Migrations
```bash
# Check status
npm run db:status

# Apply pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:undo

# Dry run (preview SQL)
npm run db:migrate:dry
```

## 📂 Important Directories

### Backend
- `backend/src/controllers/` - Request handlers
- `backend/src/routes/` - API route definitions
- `backend/src/services/` - Business logic (AI, vector, Ollama)
- `backend/src/middleware/` - Auth, error handling
- `backend/src/db/migrations/` - SQL migrations

### Frontend
- `frontend/src/pages/` - Route components (Dashboard, Chat, Memories, etc.)
- `frontend/src/components/` - Reusable UI components
- `frontend/src/context/` - React Context (AuthContext)
- `frontend/src/services/` - API client

## 🎨 Code Style Quick Reference

### Backend (Node.js/Express)
- ES Modules (`import`/`export`)
- Async/await for all async operations
- Zod for validation
- JWT for authentication
- Error handling via middleware

### Frontend (React)
- Functional components + hooks
- Zustand for global state
- TanStack Query for server state
- Tailwind CSS for styling
- Lucide React for icons

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ bcrypt password hashing
- ✅ Helmet.js security headers
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration
- ✅ Environment variable protection

## 🧪 Testing Strategy

### Current Coverage
- Backend: Jest configured (tests to be expanded)
- Frontend: No tests yet (planned)

### Test Commands
```bash
# Backend tests
cd backend
npm test
```

## 📊 Database Schema (Quick Overview)

### Core Tables
- **users**: Authentication and user profiles
- **memories**: Main content storage with vector embeddings
- **categories**: Organization taxonomy
- **chat_sessions**: RAG conversation sessions
- **chat_messages**: Individual chat messages with context
- **llm_settings**: User LLM provider preferences

### Key Columns
- `memories.embedding`: VECTOR(1536) for semantic search
- `memories.tags`: TEXT[] for tag filtering
- `memories.structured_content`: JSONB for AI processing
- `chat_messages.memory_context`: JSONB for RAG context

## 🎯 For This Session

### What You Need to Know
1. **Project Type**: Full-stack knowledge management with AI
2. **Backend Stack**: Express + PostgreSQL + pgvector
3. **Frontend Stack**: React + Vite + Tailwind
4. **AI Stack**: OpenAI, Anthropic, Ollama for RAG chat
5. **Deployment**: Docker Compose with 5 services

### Files Modified Recently
- `.llm-context/` - New documentation system being created
- `docs/` - Feature documentation (LLM settings, AI chat)
- `backend/src/db/migrations/` - Latest: 002_add_llm_settings.sql

### Current Constraints
- Must maintain backward compatibility with existing data
- All database changes require migrations
- Frontend must remain responsive on mobile
- Support for offline/local LLM via Ollama

## 🔗 Quick Links to Context Files

**Getting Started**
- Architecture: `.llm-context/architecture/overview.md`
- Tech Stack: `.llm-context/architecture/tech-stack.md`

**API Development**
- Endpoints: `.llm-context/api/endpoints-registry.md`
- Auth Flow: `.llm-context/api/authentication.md`

**Database Work**
- Schema: `.llm-context/database/schema-overview.md`
- Migrations: `.llm-context/database/migrations-log.md`

**Frontend Development**
- Components: `.llm-context/frontend/component-registry.md`
- Routing: `.llm-context/frontend/routing.md`

**Backend Development**
- Services: `.llm-context/backend/service-layer.md`
- Integrations: `.llm-context/backend/external-integrations.md`

## 💡 Tips for This Codebase

1. **Vector Search**: All semantic search uses pgvector's cosine similarity
2. **Migrations**: Never modify existing migrations, always create new ones
3. **LLM Fallback**: System gracefully handles missing API keys
4. **Chat Context**: RAG retrieves top 5 relevant memories per query
5. **Rate Limiting**: 100 requests/15min per IP on most endpoints

---

**Last Updated**: 2026-01-24  
**Session Type**: Development + Documentation  
**Next Update**: After major feature completion
