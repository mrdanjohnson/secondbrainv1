# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Second Brain is a full-stack AI-powered knowledge management system with automated capture, semantic search, and RAG (Retrieval-Augmented Generation) chat capabilities. The system supports multiple LLM providers (OpenAI, Anthropic, Ollama) and uses PostgreSQL with pgvector for vector embeddings.

## Architecture

### Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand (state) + TanStack Query (server state)
- **Backend**: Node.js + Express with ES Modules (`import`/`export`)
- **Database**: PostgreSQL 16 + pgvector extension for vector similarity search
- **Automation**: n8n workflow engine for Slack integration
- **AI**: OpenAI, Anthropic, or Ollama (local) for embeddings, classification, and chat
- **Deployment**: Docker Compose with 5 services (frontend, backend, postgres, n8n, ollama)

### Request Flow Patterns

**Memory Creation with AI**:
```
Frontend → POST /api/memories → Auth Middleware → Controller
  → aiService.classifyAndStructure(content) → LLM Provider
  → aiService.generateEmbedding(content) → OpenAI Embeddings
  → Save to memories table with vector → Response
```

**Semantic Search**:
```
User Query → vectorService.generateEmbedding(query)
  → PostgreSQL: ORDER BY embedding <=> $1::vector
  → Results ranked by cosine similarity
```

**RAG Chat**:
```
User Message → vectorService.searchSimilar(message) → Top 5 memories
  → aiService.generateChatResponse(messages, context)
  → LLM with RAG context → Save to chat_messages
```

### Key Design Patterns

1. **Service Layer Architecture**: Controllers delegate to services (aiService, vectorService, ollamaService)
2. **Multi-Provider LLM**: Users configure per-feature providers via `user_llm_settings` table
3. **JWT Authentication**: Stateless auth with middleware validation
4. **Vector Search**: pgvector IVFFlat index with cosine similarity (`<=>` operator)
5. **Migration System**: Versioned SQL migrations tracked in `schema_migrations` table

## Common Development Commands

### Docker Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [backend|frontend|postgres|n8n|ollama]

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down
```

### Backend Development
```bash
cd backend

# Development with hot reload
npm run dev

# Production
npm start

# Database migrations
npm run db:status          # Check current migration status
npm run db:migrate         # Apply pending migrations
npm run db:migrate:dry     # Preview SQL without applying
npm run db:migrate:undo    # Rollback last migration

# Direct database access
docker-compose exec postgres psql -U secondbrain -d second_brain
```

### Frontend Development
```bash
cd frontend

# Development server (port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
cd backend
npm test        # Run Jest tests (currently minimal coverage)
```

### Ollama (Local LLMs)
```bash
# Pull a model
docker exec -it second-brain-ollama ollama pull llama3.2

# List installed models
docker exec -it second-brain-ollama ollama list

# Test a model
docker exec -it second-brain-ollama ollama run llama3.2
```

## Natural Language Date Search

### Overview
The system supports natural language date queries in both search and AI chat:

**Supported Phrases**:
- `yesterday`, `today`, `tomorrow`
- `last 3 days`, `next week`, `last month`
- `this week`, `this month`
- `overdue` (for due_date filtering)

**Three Date Fields**:
1. **memory_date** - When the event occurred
2. **due_date** - When something is due
3. **received_date** - When content was captured

Each date stored as `TIMESTAMP WITH TIME ZONE` + formatted as `mm/dd/yy` string

### Frontend Usage

**Search Page (`Search.jsx`)**:
- Expandable date filters section
- Quick presets (Today, Yesterday, Last Week, etc.)
- Natural language text input
- Date field selector (memory_date/due_date/received_date)
- Example: Search "project ideas" + filter "last week" on "memory_date"

**Memories Page (`Memories.jsx`)**:
- Sort by any date field (created_at, memory_date, due_date, received_date)

**Chat Page (`Chat.jsx`)**:
- Automatic date detection in messages
- Example: "Summarize my tasks from yesterday" → backend automatically filters context
- Example: "What's overdue?" → filters by due_date < now

### Backend Implementation

**Date Parser (`backend/src/utils/dateParser.js`)**:
```javascript
parseDateQuery('last week')
// Returns: { startDate, endDate, dateField: 'memory_date' }
```

**Smart Field Detection**:
- "due yesterday" → uses `due_date`
- "received last week" → uses `received_date`
- Default → uses `memory_date`

**Search Controller** (`backend/src/controllers/search.js`):
```javascript
POST /api/search/semantic
{
  "query": "project ideas",
  "dateQuery": "last week",      // Natural language
  "dateField": "memory_date"     // Which field to filter
}
```

**Chat Controller** (`backend/src/controllers/chat.js`):
- Automatically detects date phrases in user messages
- Filters RAG context by detected date range
- No frontend changes needed

## Cleanup Management System

### Overview
Automated memory deletion system with cron-based scheduling. Configured via Settings > Data tab.

### Features
- **Filter by multiple criteria**: Date fields, tags, categories, or combinations
- **Flexible scheduling**: Daily, weekly, monthly, or manual-only
- **Preview functionality**: See what will be deleted before running
- **Execution logs**: Track all cleanup operations with detailed history
- **Manual triggers**: Run any job on-demand regardless of schedule

### Database Tables
- **cleanup_jobs**: Job configuration and scheduling
- **cleanup_job_logs**: Execution history with deleted memory IDs

### Job Configuration Options

**Filter Types**:
- `date` - Filter by date field only
- `tag` - Filter by tags only
- `category` - Filter by category only
- `combined` - All filters combined with AND logic

**Date Filtering**:
- Fields: `memory_date_formatted`, `due_date_formatted`, `received_date_formatted`
- Operators: `before`, `after`, `equals`
- Values: Relative ("30 days", "1 week") or absolute ("01/15/26")

**Scheduling**:
- `manual` - No automatic execution
- `daily` - Runs once per day at specified time
- `weekly` - Runs on specific day of week
- `monthly` - Runs on specific day of month
- Time zone: Server's local timezone

### Backend Implementation

**Service** (`backend/src/services/cleanupService.js`):
```javascript
executeCleanupJob(jobId, executionType)  // Run a job
previewCleanup(jobId)                    // Dry run preview
runAllScheduledJobs()                    // Cron trigger
calculateNextRun(job)                    // Schedule next execution
```

**Cron Job** (`backend/src/jobs/cleanupCron.js`):
- Runs every hour
- Checks for jobs where `next_run <= NOW()`
- Executes eligible jobs
- Updates `last_run` and `next_run` timestamps

**API Endpoints** (`backend/src/controllers/cleanup.js`):
```javascript
GET    /api/cleanup/jobs              // List all jobs
POST   /api/cleanup/jobs              // Create job
GET    /api/cleanup/jobs/:id          // Get job details
PUT    /api/cleanup/jobs/:id          // Update job
DELETE /api/cleanup/jobs/:id          // Delete job
POST   /api/cleanup/jobs/:id/run      // Manual execution
POST   /api/cleanup/preview           // Preview (no deletion)
GET    /api/cleanup/jobs/:id/logs     // Execution history
```

### Frontend Component

**CleanupManagement** (`frontend/src/components/CleanupManagement.jsx`):
- Full CRUD interface for cleanup jobs
- Modal for creating/editing jobs with live form validation
- Preview feature with memory count and sample items
- Expandable job cards showing full configuration
- Execution logs viewer with success/error status
- Manual run buttons with confirmation
- Color-coded status indicators

### Usage Example

**Create a cleanup job to delete old tasks**:
1. Go to Settings > Data tab
2. Click "New Job"
3. Configure:
   - Name: "Delete old completed tasks"
   - Filter: Combined
   - Date: memory_date_formatted before "90 days"
   - Category: Task
   - Tags: completed
   - Schedule: Weekly (Sunday at 2:00 AM)
4. Click "Preview" to verify
5. Click "Create Job"

**Result**: Every Sunday at 2 AM, completed tasks older than 90 days are automatically deleted.

### Safety Features
- Preview mode shows exactly what will be deleted
- Active/inactive toggle per job
- Execution logs preserve deleted memory IDs
- Confirmation required for manual runs
- Warning banners on destructive operations

## Database Schema

### Core Tables
- **users**: Authentication (email, password_hash, preferences)
- **user_llm_settings**: Per-user LLM provider configuration (chat, search, embedding settings)
- **memories**: Main content with `embedding VECTOR(1536)`, `tags TEXT[]`, `structured_content JSONB`
- **categories**: Taxonomy (Idea, Task, Project, Reference, Journal, Meeting, Learning, Unsorted)
- **chat_sessions**: RAG conversation sessions
- **chat_messages**: Individual messages with `memory_context JSONB` for RAG
- **schema_migrations**: Migration tracking

### Key Indexes
- `idx_memories_embedding` (IVFFlat): Vector similarity search with cosine distance
- `idx_memories_tags` (GIN): Tag array operations
- `idx_memories_category` (B-tree): Category filtering
- `idx_memories_created_at` (B-tree DESC): Recent queries

### Foreign Key Cascades
- Deleting a user cascades to: `user_llm_settings`, `chat_sessions`, and their `chat_messages`
- Deleting a chat session cascades to all its messages

## Critical Patterns

### Migration Workflow
**NEVER modify existing migrations** - always create new ones:

```bash
# 1. Create new migration file
touch backend/src/db/migrations/003_add_new_feature.js

# 2. Implement up/down functions
export const up = async (db) => {
  await db.query(`ALTER TABLE...`);
};

export const down = async (db) => {
  await db.query(`ALTER TABLE...`);
};

# 3. Test thoroughly
npm run db:migrate:dry   # Preview
npm run db:migrate       # Apply
npm run db:migrate:undo  # Test rollback
npm run db:migrate       # Re-apply
```

### Adding Backend API Endpoint

1. **Create controller** in `backend/src/controllers/`:
```javascript
export const myController = {
  async create(req, res) {
    try {
      const userId = req.user.id;  // From auth middleware
      // Business logic
      res.status(201).json({ data: result });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
```

2. **Create route** in `backend/src/routes/`:
```javascript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { myController } from '../controllers/myController.js';

const router = Router();
router.post('/', authMiddleware, myController.create);
export default router;
```

3. **Register in** `backend/src/index.js`:
```javascript
import myRoutes from './routes/myRoutes.js';
app.use('/api/my-resource', myRoutes);
```

### Adding Frontend Component

1. **Create page** in `frontend/src/pages/`:
```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export default function MyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: async () => {
      const res = await api.get('/my-resource');
      return res.data;
    }
  });

  // Component JSX
}
```

2. **Add route** in `frontend/src/main.jsx`
3. **Add navigation** in layout component

### AI Service Integration

All AI calls go through `backend/src/services/aiService.js`:

```javascript
// Classification
const result = await aiService.classifyAndStructure(content, userId);

// Embeddings
const embedding = await aiService.generateEmbedding(text);

// Chat
const response = await aiService.generateChatResponse(messages, context, userId);
```

The service automatically:
- Fetches user's LLM settings from database
- Routes to correct provider (OpenAI/Anthropic/Ollama)
- Falls back to defaults if settings not found
- Handles provider-specific API differences

### Vector Search Pattern

```javascript
// Generate query embedding
const embedding = await vectorService.generateEmbedding(query);

// Similarity search
const result = await db.query(`
  SELECT *, 1 - (embedding <=> $1::vector) as similarity
  FROM memories
  WHERE user_id = $2
  ORDER BY embedding <=> $1::vector
  LIMIT $3
`, [JSON.stringify(embedding), userId, limit]);
```

## Code Style

### Backend
- Use ES Modules (`import`/`export`)
- Async/await for all async operations
- Destructure parameters from `req.body`, `req.params`, `req.user`
- Always use parameterized queries (`$1`, `$2`) to prevent SQL injection
- Error handling in try/catch with appropriate status codes
- Console.error for errors, console.log for info

### Frontend
- Functional components with hooks
- TanStack Query for all API calls (`useQuery`, `useMutation`)
- Zustand for global state (auth, settings)
- Tailwind CSS utility classes (no custom CSS files)
- Lucide React for icons
- PropTypes or TypeScript interfaces (when needed)

### Security Requirements
- All API endpoints except `/auth/login` and `/auth/register` require JWT authentication
- Use `authMiddleware` for protected routes
- Passwords hashed with bcrypt (never store plain text)
- Environment variables for all secrets (never hardcode)
- Validate user input with Zod schemas
- Check user ownership before operations (`user_id = req.user.id`)

## Environment Variables

Required in `backend/.env`:
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/second_brain
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional
OLLAMA_BASE_URL=http://ollama:11434  # Optional
PORT=3001
```

Required in `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

## Troubleshooting

### Database connection issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec backend node -e "import('./src/db/index.js').then(db => db.query('SELECT NOW()'))"

# View PostgreSQL logs
docker-compose logs postgres
```

### Migration issues
```bash
# Check status
npm run db:status

# Verify schema_migrations table exists
docker-compose exec postgres psql -U secondbrain -d second_brain -c "SELECT * FROM schema_migrations;"

# Manual migration fix (if needed)
docker-compose exec postgres psql -U secondbrain -d second_brain
DELETE FROM schema_migrations WHERE migration_name = 'problematic_migration.js';
```

### Vector search returns no results
- Verify embeddings were generated: `SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL;`
- Check similarity threshold in user settings (default 0.7)
- Ensure pgvector extension is installed: `SELECT * FROM pg_extension WHERE extname = 'vector';`

### Ollama model not working
```bash
# Verify Ollama is running
docker-compose ps ollama

# Test API directly
curl http://localhost:11434/api/tags

# Check model is pulled
docker exec -it second-brain-ollama ollama list
```

## Important Constraints

1. **Backward Compatibility**: All database changes must maintain compatibility with existing data
2. **Mobile Responsive**: Frontend must work on mobile (Tailwind's responsive classes)
3. **User Isolation**: Always filter queries by `user_id` from JWT token
4. **Rate Limiting**: 100 requests/15min per IP (configured in backend middleware)
5. **Embedding Dimensions**: OpenAI embeddings are 1536 dimensions (don't change without migration)
6. **Migration Checksums**: Never modify applied migrations (breaks checksum validation)

## Testing Strategy

Currently minimal test coverage. When adding tests:

**Backend**:
```bash
cd backend
# Test files: *.test.js alongside source
npm test
```

**Frontend**:
- Not yet configured (to be added with Vitest)

## Additional Documentation

- Architecture deep-dive: `.llm-context/architecture/overview.md`
- API endpoints: `.llm-context/api/endpoints-registry.md`
- Database schema: `.llm-context/database/schema-overview.md`
- Common tasks: `.llm-context/workflows/common-tasks.md`
- LLM settings feature: `docs/LLM-SETTINGS-QUICKSTART.md`
