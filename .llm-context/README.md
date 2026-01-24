# AI Coding Agent Toolbox - Second Brain

## 🎯 Quick Start

**For AI Coding Agents**: Start here every session:

1. Read `.llm-context/INDEX.md` - System overview and navigation
2. Read `.llm-context/QUICK_START.md` - Current project status
3. Load specific files as needed based on your task

**For Developers**: This is your comprehensive codebase documentation.

---

## 📊 Documentation Stats

- **Total Files**: 22 markdown files + 1 SQL schema
- **Total Lines**: 9,844 lines of documentation
- **Coverage**: Complete system architecture, API, database, frontend, backend, and workflows
- **Last Updated**: 2026-01-24

---

## 📁 Directory Structure

```
.llm-context/
├── INDEX.md                          # ⭐ Start here - Navigation hub
├── QUICK_START.md                    # Current sprint & session context
│
├── architecture/                     # System design
│   ├── overview.md                   # Architecture diagrams & components
│   ├── data-flow.md                  # Request flows & transformations
│   └── tech-stack.md                 # Technologies & versions
│
├── api/                              # Backend API documentation
│   ├── endpoints-registry.md         # All 40+ endpoints
│   ├── authentication.md             # JWT auth flow
│   └── error-codes.md                # HTTP status codes & errors
│
├── database/                         # PostgreSQL + pgvector
│   ├── schema-overview.md            # ERD & relationships
│   ├── schema-full.sql               # Complete DDL
│   ├── migrations-log.md             # Migration history
│   ├── query-patterns.md             # Common SQL queries
│   └── indexes.md                    # Index strategy
│
├── frontend/                         # React SPA
│   ├── component-registry.md         # All components
│   ├── state-management.md           # TanStack Query + Zustand
│   ├── routing.md                    # React Router routes
│   └── styling-conventions.md        # Tailwind patterns
│
├── backend/                          # Express API
│   └── service-layer.md              # AI, vector, Ollama services
│
├── config/                           # Configuration
│   ├── environments.md               # Environment variables
│   └── dependencies.md               # Package versions
│
├── decisions/                        # Architecture decisions
│   └── architecture-decisions.md     # 10 ADRs with rationale
│
└── workflows/                        # Development workflows
    ├── common-tasks.md               # How-to guides
    └── deployment.md                 # Docker deployment
```

---

## 🚀 How to Use

### For AI Coding Agents

**Session Initialization**:
```
1. Load: .llm-context/INDEX.md
2. Load: .llm-context/QUICK_START.md
3. Task-specific: Load relevant files from sections below
```

**By Task Type**:

| Task | Load These Files |
|------|------------------|
| **Add API endpoint** | `api/endpoints-registry.md`, `backend/service-layer.md` |
| **Database changes** | `database/schema-overview.md`, `database/migrations-log.md` |
| **UI component** | `frontend/component-registry.md`, `frontend/styling-conventions.md` |
| **Bug fix** | Relevant section + `workflows/common-tasks.md` |
| **Deployment** | `workflows/deployment.md`, `config/environments.md` |
| **Architecture decision** | `decisions/architecture-decisions.md` |

**Example Prompt**:
```
"Show me .llm-context/api/endpoints-registry.md to understand the 
existing endpoints, then help me add a new /api/notes endpoint."
```

---

### For Developers (Humans)

**Browse Documentation**:
- Start with `INDEX.md` for system overview
- Reference specific files for detailed information
- Update files when you make architectural changes

**Keep Updated**:
- Update `QUICK_START.md` weekly with current sprint
- Add to `common-tasks.md` when you solve a tricky problem
- Document decisions in `architecture-decisions.md`

---

## 📖 What's Documented

### Complete Coverage

✅ **Architecture** (3 files)
- System design and component interactions
- Data flow through all layers
- Technology choices and rationale

✅ **API** (3 files)  
- All 40+ endpoints with request/response examples
- JWT authentication flow
- Error handling and status codes

✅ **Database** (5 files)
- Complete schema with ERD
- Migration history and current version
- Common query patterns and optimizations
- Index strategy for performance

✅ **Frontend** (4 files)
- All React components with props
- TanStack Query + Zustand state patterns
- React Router routing configuration
- Tailwind CSS styling conventions

✅ **Backend** (1 file)
- AI service layer (OpenAI, Anthropic, Ollama)
- Vector search service (pgvector)
- Ollama management service

✅ **Configuration** (2 files)
- Environment variables for all services
- Dependency matrix and versions

✅ **Decisions** (1 file)
- 10 Architecture Decision Records (ADRs)
- Context, alternatives, and consequences

✅ **Workflows** (2 files)
- Common development tasks (add feature, fix bug, etc.)
- Docker deployment guide

---

## 🎨 Documentation Features

### Optimized for AI Retrieval

1. **Modular**: Each file is self-contained
2. **Scannable**: Clear headers and tables
3. **Examples**: Code snippets throughout
4. **Cross-Referenced**: Links between related docs
5. **Up-to-Date**: Reflects current codebase (2026-01-24)

### Documentation Principles

- **DRY**: Single source of truth for each concept
- **Layered**: Overview → Details → Examples
- **Practical**: Real code from the project
- **Maintained**: Updated with code changes

---

## 🔄 Maintenance

### When to Update

| Event | Update Files |
|-------|--------------|
| **New API endpoint** | `api/endpoints-registry.md` |
| **Database migration** | `database/migrations-log.md`, `database/schema-overview.md` |
| **New component** | `frontend/component-registry.md` |
| **Dependency update** | `config/dependencies.md` |
| **Architecture change** | `decisions/architecture-decisions.md` |
| **Sprint change** | `QUICK_START.md` |

### Update Process

1. Make code changes
2. Update relevant `.llm-context/` files
3. Commit documentation with code changes
4. Review documentation in PR

---

## 📊 Project Statistics

### Codebase
- **Backend**: Node.js/Express (~3,000 lines)
- **Frontend**: React (~2,500 lines)
- **Database**: PostgreSQL with 7 tables
- **Docker**: 5 services orchestrated

### Documentation
- **Files**: 23 total
- **Lines**: 9,844 lines
- **Words**: ~150,000 words
- **Topics**: Architecture, API, DB, Frontend, Backend, Config, Workflows

---

## 🌟 Benefits

### For AI Coding Agents
- **Fast Context Loading**: Load only what you need
- **Accurate Answers**: Authoritative documentation
- **Efficient Token Usage**: Retrieve vs. load everything
- **Consistent Guidance**: Standardized patterns

### For Developers
- **Onboarding**: New developers get up to speed quickly
- **Reference**: Quick lookup for API endpoints, components, etc.
- **Best Practices**: Documented patterns and conventions
- **History**: ADRs explain why decisions were made

---

## 🔗 Quick Links

- **System Overview**: `INDEX.md`
- **Current Status**: `QUICK_START.md`
- **All API Endpoints**: `api/endpoints-registry.md`
- **Database Schema**: `database/schema-overview.md`
- **Components**: `frontend/component-registry.md`
- **Deployment**: `workflows/deployment.md`
- **Common Tasks**: `workflows/common-tasks.md`

---

## 📝 Notes

- Documentation reflects codebase as of **2026-01-24**
- Keep docs in sync with code changes
- Treat documentation as part of the codebase
- Update `QUICK_START.md` weekly

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-24  
**Maintained By**: Second Brain Development Team
