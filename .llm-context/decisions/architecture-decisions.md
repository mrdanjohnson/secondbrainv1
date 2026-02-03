# Architecture Decision Records (ADRs) - Second Brain

## Overview

This document records key architectural decisions made during Second Brain development, including context, alternatives considered, and rationale.

---

## ADR Template

```markdown
# ADR-XXX: [Title]

**Date**: YYYY-MM-DD  
**Status**: [Proposed | Accepted | Deprecated | Superseded]  
**Deciders**: [Who made the decision]

## Context
[What is the issue we're trying to solve?]

## Decision
[What is the change we're making?]

## Alternatives Considered
[What other options did we evaluate?]

## Consequences
**Positive**:
- [Benefit 1]
- [Benefit 2]

**Negative**:
- [Trade-off 1]
- [Trade-off 2]

## Implementation Notes
[How to implement this decision]
```

---

## ADR-001: Separate Frontend and Backend

**Date**: 2025-12-15  
**Status**: Accepted  
**Deciders**: Development Team

### Context
We needed to choose between a monolithic framework (Next.js) or separate frontend (React) and backend (Express).

### Decision
Use separate React SPA and Express API.

### Alternatives Considered
1. **Next.js Full-Stack**
   - Pros: Single codebase, API routes built-in, SSR
   - Cons: Tighter coupling, harder to scale separately
   
2. **Remix**
   - Pros: Modern React framework, excellent UX
   - Cons: Newer, smaller ecosystem

### Consequences
**Positive**:
- Independent deployment and scaling
- Clear separation of concerns
- Easier to integrate n8n webhooks
- Frontend can be deployed to CDN

**Negative**:
- Two separate deployments
- Need CORS configuration
- Slightly more boilerplate

---

## ADR-002: PostgreSQL + pgvector for Vector Search

**Date**: 2025-12-18  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed database for both relational data and vector similarity search for semantic search functionality.

### Decision
Use PostgreSQL 16 with pgvector extension.

### Alternatives Considered
1. **Pinecone (Vector Database SaaS)**
   - Pros: Purpose-built for vectors, managed service
   - Cons: Expensive at scale ($70+/month), vendor lock-in

2. **Weaviate/Qdrant (Separate Vector DB)**
   - Pros: Optimized for vectors
   - Cons: Another service to manage, data synchronization

3. **MongoDB + Vector Search**
   - Pros: Flexible schema
   - Cons: No pgvector performance, weaker relational support

### Consequences
**Positive**:
- Single database for all data
- No synchronization issues
- Cost-effective
- Excellent PostgreSQL tooling
- pgvector is production-ready

**Negative**:
- Vector index rebuild can be slow
- Not as optimized as purpose-built vector DBs
- Approximate search (IVFFlat), not exact

### Implementation Notes
- Use IVFFlat index with 100 lists for <100k vectors
- Switch to HNSW when available (pgvector 0.5.0+)
- Rebuild index when data grows 10x

---

## ADR-003: Multi-LLM Provider Support

**Date**: 2026-01-05  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Users have different preferences for LLM providers based on cost, privacy, and quality needs.

### Decision
Support OpenAI, Anthropic Claude, and local Ollama models with user-configurable settings.

### Alternatives Considered
1. **OpenAI Only**
   - Pros: Simpler codebase, consistent behavior
   - Cons: Vendor lock-in, no privacy option, higher cost

2. **Ollama Only**
   - Pros: Complete privacy, no API costs
   - Cons: Requires GPU, slower, setup complexity

### Consequences
**Positive**:
- User choice and flexibility
- Cost optimization (Ollama for dev, OpenAI for prod)
- Privacy option for sensitive data
- Reduced vendor lock-in

**Negative**:
- More complex service layer
- Need to test with all providers
- Different output formats to handle

### Implementation Notes
- Provider selection stored per user in `user_llm_settings`
- Service layer abstracts provider differences
- Default to OpenAI with graceful fallback

---

## ADR-004: JWT Stateless Authentication

**Date**: 2025-12-20  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed authentication mechanism for API access.

### Decision
Use JWT (JSON Web Tokens) for stateless authentication with 24-hour expiry.

### Alternatives Considered
1. **Session-Based (Redis)**
   - Pros: Can revoke immediately, server control
   - Cons: Requires Redis, not stateless, harder to scale

2. **Passport.js OAuth**
   - Pros: Social login support
   - Cons: More complex, still need session management

### Consequences
**Positive**:
- Stateless (no database lookup per request)
- Scalable (works across multiple backend instances)
- Standard approach

**Negative**:
- Cannot revoke tokens before expiry
- Must store secret securely
- 24-hour window if compromised

### Future Enhancements
- Implement refresh token pattern
- Add token blacklist (Redis) for immediate revocation
- Reduce access token expiry to 15min with refresh tokens

---

## ADR-005: TanStack Query for Server State

**Date**: 2026-01-08  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed efficient client-side state management for server data (memories, chats, etc).

### Decision
Use TanStack Query (React Query) for all server state management.

### Alternatives Considered
1. **Redux Toolkit + RTK Query**
   - Pros: Powerful, integrates with Redux
   - Cons: More boilerplate, overkill for our needs

2. **SWR**
   - Pros: Simple, lightweight
   - Cons: Less features, smaller community

3. **Zustand + Manual Fetching**
   - Pros: Simple state management
   - Cons: No built-in caching, refetching, optimistic updates

### Consequences
**Positive**:
- Automatic caching and refetching
- Optimistic updates built-in
- Request deduplication
- Background refetching
- Excellent DevTools

**Negative**:
- Learning curve for team
- Another dependency

---

## ADR-006: Zustand for Minimal Global UI State

**Date**: 2026-01-10  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed lightweight solution for global UI state (theme, sidebar collapsed, etc).

### Decision
Use Zustand for minimal global UI state, while TanStack Query handles all server state.

### Alternatives Considered
1. **Redux**
   - Pros: Industry standard, powerful DevTools
   - Cons: Too much boilerplate for simple UI state

2. **React Context**
   - Pros: Built-in, no dependencies
   - Cons: Re-render issues, verbose

### Consequences
**Positive**:
- Minimal boilerplate
- Small bundle size (~1KB)
- No Provider hell
- Easy to persist (localStorage integration)

**Negative**:
- Another state management library
- Less widespread than Redux

### Implementation Notes
- Use only for UI state (theme, modals, sidebar)
- All server data stays in TanStack Query
- Persist theme with `persist` middleware

---

## ADR-007: Docker Compose for Deployment

**Date**: 2025-12-22  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed deployment strategy for self-hosted installation.

### Decision
Use Docker Compose to orchestrate all services (PostgreSQL, n8n, Backend, Frontend, Ollama).

### Alternatives Considered
1. **Kubernetes**
   - Pros: Production-grade orchestration, auto-scaling
   - Cons: Too complex for self-hosted use case, overkill

2. **Manual Installation**
   - Pros: Full control
   - Cons: Error-prone, hard to replicate, poor UX

3. **Heroku/Railway**
   - Pros: Easy deployment
   - Cons: Monthly costs, not self-hosted

### Consequences
**Positive**:
- One-command deployment (`docker-compose up`)
- Consistent environments (dev/prod)
- Easy to self-host
- Portable across systems

**Negative**:
- Requires Docker knowledge
- Not suitable for large-scale deployments
- Manual scaling

### Future Considerations
- Provide Kubernetes manifests for enterprise users
- Add cloud deployment guides (AWS, GCP, Azure)

---

## ADR-008: ES Modules in Backend

**Date**: 2025-12-16  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed to choose module system for Node.js backend.

### Decision
Use ES Modules (`import`/`export`) instead of CommonJS (`require`).

### Alternatives Considered
1. **CommonJS (require)**
   - Pros: More mature, wider compatibility
   - Cons: Older standard, verbose

### Consequences
**Positive**:
- Modern JavaScript standard
- Better tree-shaking
- Cleaner syntax
- Future-proof

**Negative**:
- Some older packages don't support ESM
- Need `"type": "module"` in package.json

### Implementation Notes
- Set `"type": "module"` in package.json
- Use `.js` extension for all files
- Import with `.js` extension: `import x from './file.js'`

---

## ADR-009: n8n for Workflow Automation

**Date**: 2025-12-28  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed workflow automation for Slack integration and future integrations.

### Decision
Use n8n (self-hosted) for workflow automation.

### Alternatives Considered
1. **Zapier**
   - Pros: Easy to use, many integrations
   - Cons: SaaS only, expensive ($20+/month), not self-hosted

2. **Make (Integromat)**
   - Pros: Powerful, visual
   - Cons: SaaS only, costly

3. **Custom Webhooks**
   - Pros: Full control
   - Cons: Have to code each integration

### Consequences
**Positive**:
- Self-hosted (fits our model)
- Visual workflow builder
- Extensive integrations (400+)
- Free and open-source

**Negative**:
- Another service to manage
- Learning curve for complex workflows

---

## ADR-010: Tailwind CSS for Styling

**Date**: 2025-12-17  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Needed CSS framework for rapid UI development.

### Decision
Use Tailwind CSS utility-first framework.

### Alternatives Considered
1. **Styled Components**
   - Pros: Component-scoped styles, dynamic styling
   - Cons: Runtime overhead, larger bundle

2. **CSS Modules**
   - Pros: Simple, scoped styles
   - Cons: More files, no utility classes

3. **Bootstrap**
   - Pros: Pre-built components
   - Cons: Heavy, opinionated design

### Consequences
**Positive**:
- Rapid prototyping
- Consistent design system
- Small production bundle (PurgeCSS)
- No naming conflicts

**Negative**:
- Long className strings
- Learning curve for utility classes

---

## Deprecated/Superseded Decisions

### ADR-004-DEPRECATED: Session-Based Auth (Superseded by JWT)
Originally considered session-based auth with Redis, but moved to JWT for better scalability.

---

## Future Decisions to Make

1. **Testing Framework**: Jest vs Vitest vs Playwright
2. **TypeScript Migration**: Incremental adoption strategy
3. **GraphQL vs REST**: If API complexity grows
4. **Microservices**: If scaling requirements increase
5. **Caching Layer**: Redis for distributed caching
6. **Message Queue**: Bull/BullMQ for async jobs

---

**Last Updated**: 2026-01-26  
**Total ADRs**: 11 (10 accepted, 1 deprecated)  
**Next Review**: Q2 2026

---

## ADR-011: Priority-Based Multi-Stage Search

**Date**: 2026-01-26  
**Status**: Accepted  
**Deciders**: Development Team

### Context
Original semantic search used pure vector similarity, which often returned semantically similar but contextually irrelevant results. Users needed to find memories by specific dates, categories, or tags, but these structured filters were treated equally with semantic similarity.

**Problem Examples**:
- "work tasks from yesterday" returned all "work" memories sorted by similarity, ignoring the date
- Category matches scored the same as weak semantic matches
- No natural language understanding of queries

### Decision
Implement a 4-stage priority filtering system with score boosting:

1. **Date Filtering** (Priority 1): Filter by date range using natural language
2. **Category Matching** (Priority 2): Exact match with +3.0 score boost
3. **Tag Matching** (Priority 3): Contains match with +1.5 boost per tag
4. **Vector Similarity** (Priority 4): Semantic embeddings (0.0-1.0)

**Score Calculation**:
```
final_score = similarity + category_boost + tag_boost
```

**Architecture**:
- `queryAnalyzer.js`: Extract categories, tags, dates from natural language
- `smartSearch.js`: Apply priority filters and calculate composite scores
- Single SQL query with all filters and score boosting

### Alternatives Considered

1. **Weighted Vector Search**
   - Pros: Simpler, no query parsing needed
   - Cons: Can't enforce hard filters (e.g., date ranges), no exact match priority
   - Why Rejected: Couldn't guarantee date-specific results

2. **Separate Filter UI**
   - Pros: Explicit filters, no NLP complexity
   - Cons: Poor UX, requires multiple inputs, not conversational
   - Why Rejected: Defeats purpose of "natural language" search

3. **Elasticsearch with Boosting**
   - Pros: Industry-standard, powerful query DSL
   - Cons: Additional infrastructure, learning curve, overkill for current scale
   - Why Rejected: Unnecessary complexity, already have pgvector

4. **LLM-Based Query Parsing**
   - Pros: Better NLP, handles complex queries
   - Cons: Slow (200-500ms), costs money per query, overkill
   - Why Rejected: Regex + DB lookups are fast enough (<20ms)

### Consequences

**Positive**:
- **Better Relevance**: Date-specific queries now work correctly
- **Transparent Scoring**: Users see why results matched (badges)
- **Fast**: Single SQL query, no additional latency
- **Natural Language**: "work tasks from yesterday" just works
- **Synonym Support**: "meetings" → "meeting", "todos" → "task"
- **Consistent**: Chat and search use same intelligence

**Negative**:
- **API Breaking Change**: Response structure changed (added `analysis`, `metadata`)
- **More Complex**: Query analyzer + smart search vs simple vector search
- **Synonym Maintenance**: Need to update synonym mappings as categories evolve

**Neutral**:
- Score values >1.0 (due to boosting) may confuse users initially
- Threshold parameter now bypassed for exact matches

### Implementation Notes

**New Services**:
- `backend/src/services/queryAnalyzer.js` - 113 lines
- `backend/src/services/smartSearch.js` - 220 lines

**Modified Services**:
- `backend/src/controllers/search.js` - Uses smartSearch
- `backend/src/controllers/chat.js` - Uses smartSearch for context
- `backend/src/utils/dateParser.js` - Enhanced with weekdays, quarters, synonyms

**Frontend Changes**:
- `frontend/src/pages/Search.jsx` - Search insights panel, match badges

**Testing**:
- `backend/test-smart-search.js` - Manual testing script

**Migration Path**:
- No database changes required
- Frontend needs update to handle new response fields
- Old clients still work (backwards compatible at DB level)

**Performance**:
- Query analysis: ~10-20ms
- Smart search: ~100-300ms (same as before)
- Total: No significant change

### Future Enhancements

1. **Fuzzy Category Matching**: Allow partial matches (e.g., "proj" → "project")
2. **User Feedback Learning**: Track which results users click
3. **Query Suggestions**: Auto-complete based on past queries
4. **Advanced Operators**: Support AND/OR/NOT syntax
5. **Saved Searches**: Allow users to save frequent queries

---
