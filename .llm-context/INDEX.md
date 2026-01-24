# LLM Context Toolbox - Second Brain AI System

## Overview

This is a **retrievable knowledge base** designed for efficient LLM context management for the Second Brain AI project. Instead of loading everything into memory, the LLM retrieves specific files as needed.

**About Second Brain**: A self-hosted, AI-powered knowledge management system that captures, organizes, and helps you retrieve thoughts and ideas through automated Slack integration, AI classification, semantic search via vector embeddings, and conversational RAG chat interface.

-----

## 📁 File Structure

```
.llm-context/
├── INDEX.md                          # You are here - Start here every session
├── QUICK_START.md                    # Session initialization template
├── architecture/
│   ├── overview.md                   # System architecture diagram & explanation
│   ├── data-flow.md                  # How data moves through the system
│   └── tech-stack.md                 # Technologies, versions, why chosen
├── api/
│   ├── endpoints-registry.md         # All endpoints with request/response types
│   ├── authentication.md             # Auth flow, JWT tokens, permissions
│   └── error-codes.md                # API error taxonomy
├── database/
│   ├── schema-overview.md            # ERD + table relationships
│   ├── schema-full.sql               # Complete schema DDL
│   ├── migrations-log.md             # Migration history & current version
│   ├── query-patterns.md             # Common queries & optimization notes
│   └── indexes.md                    # Index strategy & performance notes
├── frontend/
│   ├── component-registry.md         # All shared components + props
│   ├── state-management.md           # Zustand structure
│   ├── routing.md                    # Routes, guards, navigation patterns
│   ├── hooks-registry.md             # Custom hooks + usage examples
│   └── styling-conventions.md        # Tailwind CSS patterns
├── backend/
│   ├── service-layer.md              # Business logic services
│   ├── middleware.md                 # Express middleware chain
│   └── external-integrations.md      # n8n, OpenAI, Anthropic, Ollama integrations
├── types/
│   ├── domain-models.md              # Core business domain types
│   └── api-contracts.md              # DTOs, request/response interfaces
├── config/
│   ├── environments.md               # ENV vars per environment
│   └── dependencies.md               # Package versions & compatibility
├── conventions/
│   ├── code-style.md                 # Linting, formatting, naming
│   └── error-handling.md             # How to handle/log errors
├── decisions/
│   ├── architecture-decisions.md     # ADRs (Architecture Decision Records)
│   └── technical-debt.md             # Known issues, workarounds
└── workflows/
    ├── common-tasks.md               # How to add feature, fix bug, etc.
    ├── deployment.md                 # Docker deployment, compose orchestration
    └── troubleshooting.md            # Common issues & solutions
```

-----

## 🎯 How to Use This System

### **For LLMs (AI Assistants)**

#### Session Start:

1. **Read `INDEX.md`** (this file) to understand structure
2. **Read `QUICK_START.md`** to get current session context
3. **Load only essential context** based on task at hand

#### During Coding:

1. **Retrieve specific files** as needed:
   - "Show me `.llm-context/api/endpoints-registry.md`"
   - "What's in `.llm-context/database/schema-overview.md`?"
2. **Reference, don't duplicate**: Point to file location instead of copying content
3. **Update files** when architecture changes

#### Retrieval Examples:

```markdown
# When implementing new API endpoint:
→ Read: api/endpoints-registry.md
→ Read: api/authentication.md
→ Read: types/api-contracts.md

# When adding database feature:
→ Read: database/schema-overview.md
→ Read: database/query-patterns.md
→ Skim: database/migrations-log.md (last 3 entries)

# When building UI component:
→ Read: frontend/component-registry.md
→ Read: frontend/styling-conventions.md
→ Scan: frontend/hooks-registry.md

# When working with AI/LLM features:
→ Read: backend/service-layer.md (aiService, vectorService, ollamaService)
→ Read: backend/external-integrations.md
→ Read: database/schema-overview.md (embeddings table)
```

### **For Developers (Humans)**

1. **Initialize**: This structure is already in your project root
2. **Reference in prompts**: "Check `.llm-context/api/` for endpoint info"
3. **Keep updated**: Treat like code documentation - update when you change architecture

-----

## 📚 Quick Reference by Task

### Adding a New API Endpoint
```
1. Read: .llm-context/api/endpoints-registry.md
2. Read: .llm-context/backend/service-layer.md
3. Add route in backend/src/routes/
4. Add controller in backend/src/controllers/
5. Update .llm-context/api/endpoints-registry.md
```

### Adding a New Database Table
```
1. Read: .llm-context/database/schema-overview.md
2. Create migration in backend/src/db/migrations/
3. Run: npm run db:migrate
4. Update .llm-context/database/schema-overview.md
5. Update .llm-context/database/migrations-log.md
```

### Adding a New Frontend Component
```
1. Read: .llm-context/frontend/component-registry.md
2. Read: .llm-context/frontend/styling-conventions.md
3. Create component in frontend/src/components/
4. Update .llm-context/frontend/component-registry.md
```

### Working with Vector Embeddings
```
1. Read: .llm-context/backend/service-layer.md (vectorService)
2. Read: .llm-context/database/schema-overview.md (memories.embedding)
3. Read: .llm-context/database/query-patterns.md (vector similarity search)
```

### Configuring LLM Providers
```
1. Read: .llm-context/backend/external-integrations.md
2. Read: .llm-context/config/environments.md
3. Check: .llm-context/api/endpoints-registry.md (llmSettings endpoints)
```

-----

## 🔄 Maintenance Workflows

### After Adding New Feature

```bash
# Update relevant files
.llm-context/api/endpoints-registry.md          # New endpoints
.llm-context/database/schema-overview.md        # New tables
.llm-context/frontend/component-registry.md     # New components
.llm-context/QUICK_START.md                     # Update current focus
```

### After Database Migration

```bash
# Update these files
.llm-context/database/schema-overview.md        # Relationship changes
.llm-context/database/schema-full.sql           # Full DDL export
.llm-context/database/migrations-log.md         # Log the migration
```

### Weekly Review

- [ ] Update `QUICK_START.md` with current sprint
- [ ] Archive old decisions to `decisions/` folder
- [ ] Check if any components deprecated
- [ ] Verify dependency versions accurate

-----

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.3.1
- **Routing**: React Router v6.24.0
- **State**: Zustand 4.5.2, TanStack Query 5.40.0
- **Styling**: Tailwind CSS 3.4.4
- **UI**: Lucide React icons, Framer Motion animations

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 4.19.2
- **Database**: PostgreSQL 16 + pgvector extension
- **Auth**: JWT (jsonwebtoken 9.0.2), bcryptjs 2.4.3
- **Security**: Helmet 7.1.0, express-rate-limit 7.2.0

### AI/ML Stack
- **LLM Providers**: OpenAI 4.47.1, Anthropic 0.39.0, Ollama (local)
- **Vector Search**: pgvector (PostgreSQL extension)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Automation**: n8n (workflow orchestration)
- **Database**: PostgreSQL 16 with pgvector

-----

## 🛠️ Project Structure

```
secondbrainv1/
├── backend/              # Node.js REST API (port 3001)
├── frontend/             # React SPA (port 5173)
├── shared/               # Shared SQL initialization
├── n8n/                  # Workflow automation configs
├── docs/                 # Feature documentation
└── .llm-context/         # This documentation system
```

-----

## 📖 Key Features

1. **Automated Thought Capture**: Slack → n8n → Backend API
2. **AI-Powered Categorization**: Automatic tagging and classification
3. **Semantic Search**: Vector embeddings for meaning-based search
4. **RAG Chat Interface**: Conversational access to knowledge base
5. **Multi-LLM Support**: OpenAI, Claude, Ollama (local)
6. **Self-Hosted**: Full Docker Compose deployment

-----

## 🔗 Important Links

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5173
- **n8n Workflows**: http://localhost:5678
- **PostgreSQL**: localhost:5432

-----

**Last Updated**: 2026-01-24  
**Maintained By**: Second Brain Development Team  
**Questions?** See `workflows/troubleshooting.md` or check the docs/ directory
