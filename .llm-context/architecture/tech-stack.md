# Technology Stack - Second Brain AI System

## Overview

This document provides detailed information about all technologies used in Second Brain, including versions, rationale, and alternatives considered.

---

## Frontend Stack

### Core Framework
**React 18.3.1**
- **Why**: Industry standard, massive ecosystem, excellent TypeScript support
- **Alternatives Considered**: Vue 3, Svelte, Solid.js
- **Key Features Used**:
  - Functional components
  - Hooks (useState, useEffect, useContext, custom hooks)
  - Suspense boundaries (future)
  - Concurrent rendering

### Build Tool
**Vite 5.3.1**
- **Why**: Lightning-fast HMR, native ES modules, optimized builds
- **Alternatives Considered**: Create React App, Webpack, Parcel
- **Configuration**: `/frontend/vite.config.js`
- **Key Features**:
  - Hot Module Replacement (HMR)
  - ES Module support
  - Optimized production builds
  - Plugin ecosystem

### Routing
**React Router v6.24.0**
- **Why**: De facto standard for React SPAs, hooks-based API
- **Alternatives Considered**: TanStack Router, Wouter
- **Key Features Used**:
  - BrowserRouter
  - Routes and Route components
  - useNavigate, useParams, useLocation hooks
  - Protected routes pattern

### State Management

#### Global State: **Zustand 4.5.2**
- **Why**: Minimal boilerplate, no Provider hell, excellent TypeScript support
- **Alternatives Considered**: Redux Toolkit, Jotai, Recoil
- **Use Cases**: Auth state, UI preferences, global modals
- **Store Location**: `/frontend/src/stores/` (if created)

#### Server State: **TanStack Query (React Query) 5.40.0**
- **Why**: Best-in-class data synchronization, caching, and optimistic updates
- **Alternatives Considered**: SWR, RTK Query, Apollo Client
- **Key Features Used**:
  - useQuery for fetching
  - useMutation for updates
  - Query invalidation
  - Optimistic updates
  - Automatic refetching
  - Request deduplication

### Styling

#### **Tailwind CSS 3.4.4**
- **Why**: Utility-first, rapid prototyping, consistent design system
- **Alternatives Considered**: Styled Components, CSS Modules, Emotion
- **Configuration**: `/frontend/tailwind.config.js`
- **PostCSS**: 8.4.38
- **Autoprefixer**: 10.4.19

### UI Components & Icons

#### **Lucide React 0.379.0**
- **Why**: Modern, customizable icons, tree-shakeable
- **Alternatives Considered**: React Icons, Heroicons, Feather Icons
- **Usage**: Import only what you need

#### **Framer Motion 11.2.10**
- **Why**: Powerful animations, layout transitions, gestures
- **Alternatives Considered**: React Spring, GSAP, CSS animations only
- **Use Cases**: Page transitions, modal animations, micro-interactions

### Utilities

#### **date-fns 3.6.0**
- **Why**: Modular, tree-shakeable, immutable date utilities
- **Alternatives Considered**: Moment.js (deprecated), Day.js, Luxon
- **Common Functions**: format, parseISO, formatDistanceToNow

#### **react-markdown 9.0.1**
- **Why**: Render markdown in chat responses
- **Alternatives Considered**: Marked, markdown-it
- **Use Cases**: Chat message formatting, rich text display

---

## Backend Stack

### Runtime & Framework

#### **Node.js (ES Modules)**
- **Version**: LTS (20.x recommended)
- **Module System**: ES Modules (type: "module" in package.json)
- **Why**: Modern JavaScript, native import/export

#### **Express 4.19.2**
- **Why**: Mature, flexible, extensive middleware ecosystem
- **Alternatives Considered**: Fastify, Koa, Hapi
- **Key Middleware Used**:
  - express.json() - Body parsing
  - express.urlencoded() - Form data
  - Custom error handler
  - Custom auth middleware

### Database & ORM

#### **PostgreSQL 16**
- **Why**: Reliability, ACID compliance, excellent performance
- **Alternatives Considered**: MongoDB (no relational support), MySQL (no pgvector)
- **Extensions Used**:
  - **pgvector 0.5.1**: Vector similarity search
  - gen_random_uuid(): UUID generation

#### **pg (node-postgres) 8.11.5**
- **Why**: Native PostgreSQL driver, connection pooling, prepared statements
- **Alternatives Considered**: Prisma (too heavy), TypeORM, Sequelize
- **Configuration**: Connection pool in `/backend/src/db/index.js`

### Authentication & Security

#### **jsonwebtoken 9.0.2**
- **Why**: Industry standard for stateless auth
- **Alternatives Considered**: Passport.js, Auth0 SDK
- **Token Expiry**: 24 hours
- **Algorithm**: HS256 (HMAC with SHA-256)

#### **bcryptjs 2.4.3**
- **Why**: Secure password hashing, JavaScript-only (no C++ bindings)
- **Alternatives Considered**: bcrypt (requires native bindings), argon2
- **Rounds**: 10 (good balance of security vs. speed)

#### **Helmet 7.1.0**
- **Why**: Security headers middleware (CSP, X-Frame-Options, etc.)
- **Alternatives Considered**: Manual header configuration

#### **express-rate-limit 7.2.0**
- **Why**: Prevent brute force attacks, API abuse
- **Configuration**: 100 requests per 15 minutes per IP
- **Note**: In-memory (resets on restart, use Redis for production)

### HTTP & Networking

#### **CORS 2.8.5**
- **Why**: Enable cross-origin requests from frontend
- **Configuration**: Whitelist specific origins in production

#### **Axios 1.7.9**
- **Why**: Promise-based HTTP client for external API calls
- **Alternatives Considered**: Native fetch, Got, Undici
- **Use Cases**: OpenAI API, Anthropic API, Ollama API

### Logging & Monitoring

#### **Morgan 1.10.0**
- **Why**: HTTP request logging middleware
- **Format**: 'dev' in development, 'combined' in production
- **Alternatives Considered**: Winston, Pino, Bunyan

### Validation

#### **Zod 3.23.8**
- **Why**: TypeScript-first schema validation, excellent error messages
- **Alternatives Considered**: Joi, Yup, Ajv
- **Use Cases**: Request validation, environment variable validation

### Utilities

#### **UUID 9.0.1**
- **Why**: Generate RFC4122 UUIDs
- **Alternatives Considered**: Native crypto.randomUUID() (Node 14.17+)

#### **dotenv 16.4.5**
- **Why**: Load environment variables from .env file
- **Configuration**: Loaded in `/backend/src/index.js`

---

## AI/ML Stack

### LLM Providers

#### **OpenAI SDK 4.47.1**
- **Why**: Market leader, best embeddings, reliable API
- **Models Used**:
  - **GPT-4o**: Primary chat model (128k context)
  - **GPT-4**: High-quality classification
  - **GPT-4o Mini**: Cost-effective option
  - **text-embedding-3-small**: Embeddings (1536 dimensions)
- **Alternatives Considered**: GPT-3.5 Turbo (less capable), Cohere, Together AI

#### **Anthropic SDK 0.39.0**
- **Why**: Claude models excel at reasoning and long contexts
- **Models Used**:
  - **claude-sonnet-4-20250514**: Balanced cost/quality
  - **claude-opus-4**: Highest quality (optional)
- **Alternatives Considered**: Claude 3.5 Sonnet (older)

#### **Ollama (Local LLMs)**
- **Why**: Privacy-first, no API costs, offline capability
- **Models Supported**:
  - llama3.2 (8B, 70B)
  - mistral
  - codellama
  - any Ollama-compatible model
- **Base URL**: http://ollama:11434 (Docker) or http://localhost:11434
- **Alternatives Considered**: LM Studio, vLLM, text-generation-webui

### Vector Search

#### **pgvector 0.5.1** (PostgreSQL Extension)
- **Why**: Native PostgreSQL, no separate vector database needed
- **Vector Size**: 1536 dimensions (OpenAI text-embedding-3-small)
- **Distance Metric**: Cosine similarity (<=> operator)
- **Index Type**: IVFFlat (Inverted File with Flat compression)
  - Lists: 100 (good for up to 100k vectors)
- **Alternatives Considered**:
  - Pinecone (SaaS, expensive at scale)
  - Weaviate (separate database)
  - Qdrant (separate database)
  - ChromaDB (Python-first)

---

## Workflow Automation

### **n8n (Self-Hosted)**
- **Why**: Visual workflow builder, extensive integrations, self-hosted
- **Use Cases**: Slack webhook → backend API
- **Alternatives Considered**: Zapier (SaaS, costly), Make (formerly Integromat), Pipedream
- **Port**: 5678
- **Authentication**: Basic auth (admin/password)

---

## DevOps & Deployment

### Containerization

#### **Docker**
- **Why**: Consistent environments, easy deployment, service isolation
- **Images Used**:
  - postgres:16 (with pgvector)
  - n8nio/n8n:latest
  - ollama/ollama:latest (optional)
  - Custom Node.js images (backend/frontend)

#### **Docker Compose**
- **Why**: Multi-container orchestration, easy local development
- **Services Defined**: PostgreSQL, n8n, Backend, Frontend, Ollama
- **Files**:
  - `docker-compose.yml` - Base configuration
  - `docker-compose.override.yml` - Local development overrides

---

## Development Tools

### Backend

#### **Nodemon 3.1.0**
- **Why**: Auto-restart on file changes
- **Configuration**: Watch /backend/src directory
- **Alternatives Considered**: ts-node-dev, pm2 (production-focused)

#### **Jest 29.7.0**
- **Why**: Industry standard testing framework
- **Status**: Configured but tests need expansion
- **Alternatives Considered**: Vitest, Mocha + Chai, AVA

### Frontend

#### **@vitejs/plugin-react 4.3.1**
- **Why**: React Fast Refresh for HMR

#### **@types/react 18.3.3** & **@types/react-dom 18.3.0**
- **Why**: TypeScript type definitions (even though not using TS yet)

---

## Environment Variables

### Required

```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-key-here
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://ollama:11434
PORT=3001
NODE_ENV=development

# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
WEBHOOK_URL=http://n8n:5678/webhook/
```

### Optional

```bash
# Feature Flags
ENABLE_OLLAMA=false
ENABLE_RATE_LIMITING=true

# Database
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=2

# JWT
JWT_EXPIRY=24h
```

---

## Package Management

### **npm**
- **Version**: 9.x or 10.x
- **Lockfile**: package-lock.json
- **Alternatives Considered**: Yarn, pnpm

---

## Key Technology Decisions

### Why Not TypeScript?
- **Decision**: Start with JavaScript, add TypeScript incrementally
- **Rationale**: Faster prototyping, can add later without breaking changes
- **Future**: TypeScript migration planned

### Why Not Next.js?
- **Decision**: Separate React SPA + Express API
- **Rationale**:
  - Independent scaling
  - Clearer separation of concerns
  - n8n integration simpler with dedicated backend
  - More deployment flexibility

### Why Not Redis?
- **Decision**: Not added yet, planned for future
- **Use Cases**: Distributed rate limiting, caching, session storage
- **Timeline**: Add when scaling beyond single instance

### Why Not GraphQL?
- **Decision**: REST API is sufficient
- **Rationale**:
  - Simpler architecture
  - No over/under-fetching issues yet
  - REST is more familiar to most developers
- **Future**: Consider for complex queries with many relationships

---

## Version Compatibility Matrix

| Package | Version | Node.js | PostgreSQL | Browser |
|---------|---------|---------|------------|---------|
| React | 18.3.1 | N/A | N/A | Modern (ES6+) |
| Express | 4.19.2 | 18+ | N/A | N/A |
| pg | 8.11.5 | 14+ | 12+ | N/A |
| pgvector | 0.5.1 | N/A | 11+ | N/A |
| OpenAI SDK | 4.47.1 | 18+ | N/A | N/A |
| Vite | 5.3.1 | 18+ | N/A | N/A |

---

## Upgrade Path & Maintenance

### Regular Updates (Monthly)
- Security patches for all dependencies
- Minor version updates (backward compatible)

### Major Updates (Quarterly)
- React ecosystem updates
- Express and middleware updates
- LLM SDK updates (breaking changes common)

### PostgreSQL & Extensions (Annually)
- PostgreSQL major version (16 → 17)
- pgvector updates

---

**Last Updated**: 2026-01-24  
**Node.js Recommended**: 20.x LTS  
**PostgreSQL Version**: 16  
**Browser Support**: Modern browsers (ES2020+)
