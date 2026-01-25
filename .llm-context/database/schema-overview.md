# Database Schema Overview - Second Brain

## Entity Relationship Diagram (ERD)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                              │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)       UUID  │
│ email         VARCHAR(255) UNIQUE │
│ password_hash VARCHAR(255) │
│ name          VARCHAR(100) │
│ preferences   JSONB  │
│ created_at    TIMESTAMPTZ │
│ updated_at    TIMESTAMPTZ │
└──────────┬──────────┘
           │ 1
           │
           │ n
┌──────────▼──────────────────────┐
│  user_llm_settings              │
├─────────────────────────────────┤
│ id (PK)              UUID       │
│ user_id (FK)         UUID       │ → users.id (CASCADE DELETE)
│ chat_provider        VARCHAR(20)│
│ chat_model           VARCHAR(100)│
│ chat_temperature     NUMERIC    │
│ chat_max_tokens      INTEGER    │
│ chat_relevancy_score NUMERIC    │
│ search_provider      VARCHAR(20)│
│ search_model         VARCHAR(100)│
│ embedding_provider   VARCHAR(20)│
│ embedding_model      VARCHAR(100)│
│ created_at           TIMESTAMPTZ│
│ updated_at           TIMESTAMPTZ│
└─────────────────────────────────┘

┌─────────────────────┐
│     categories      │
├─────────────────────┤
│ id (PK)       SERIAL│
│ name          VARCHAR(100) UNIQUE │
│ description   TEXT  │
│ color         VARCHAR(20) │
│ created_at    TIMESTAMPTZ │
└─────────────────────┘

┌──────────┐
│  users   │
└──────┬───┘
       │ 1
       │
       │ n
┌──────▼──────────────────────────┐
│         memories                │
├─────────────────────────────────┤
│ id (PK)             UUID        │
│ raw_content         TEXT        │
│ structured_content  JSONB       │
│ category            VARCHAR(100)│
│ tags                TEXT[]      │
│ embedding           VECTOR(1536)│
│ source              VARCHAR(50) │
│ slack_message_ts    VARCHAR(50) │
│ memory_date         TIMESTAMPTZ │ ← NEW (v1.1.0)
│ due_date            TIMESTAMPTZ │ ← NEW (v1.1.0)
│ received_date       TIMESTAMPTZ │ ← NEW (v1.1.0)
│ memory_date_formatted VARCHAR(10)│ ← NEW (v1.1.0) mm/dd/yy
│ due_date_formatted  VARCHAR(10) │ ← NEW (v1.1.0) mm/dd/yy
│ received_date_formatted VARCHAR(10)│ ← NEW (v1.1.0) mm/dd/yy
│ created_at          TIMESTAMPTZ │
│ updated_at          TIMESTAMPTZ │
└─────────────────────────────────┘
                                   
┌──────────┐
│  users   │
└──────┬───┘
       │ 1
       │
       │ n
┌──────▼──────────────────────────┐
│      chat_sessions              │
├─────────────────────────────────┤
│ id (PK)             UUID        │
│ user_id (FK)        UUID        │ → users.id (CASCADE DELETE)
│ title               VARCHAR(255)│
│ created_at          TIMESTAMPTZ │
│ updated_at          TIMESTAMPTZ │
└──────────┬──────────────────────┘
           │ 1
           │
           │ n
┌──────────▼──────────────────────┐
│      chat_messages              │
├─────────────────────────────────┤
│ id (PK)             UUID        │
│ session_id (FK)     UUID        │ → chat_sessions.id (CASCADE DELETE)
│ role                VARCHAR(20) │ CHECK: 'user'|'assistant'|'system'
│ content             TEXT        │
│ memory_context      JSONB       │
│ created_at          TIMESTAMPTZ │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│      schema_migrations          │
├─────────────────────────────────┤
│ id (PK)             SERIAL      │
│ migration_name      VARCHAR(100) UNIQUE │
│ applied_at          TIMESTAMPTZ │
│ checksum            VARCHAR(64) │
└─────────────────────────────────┘

┌──────────┐
│  users   │
└──────┬───┘
       │ 1
       │
       │ n
┌──────▼──────────────────────────┐
│      cleanup_jobs               │ ← NEW (v1.1.0)
├─────────────────────────────────┤
│ id (PK)             UUID        │
│ user_id (FK)        UUID        │ → users.id (CASCADE DELETE)
│ name                VARCHAR(255)│
│ filters             JSONB       │
│ schedule            VARCHAR(20) │ CHECK: 'daily'|'weekly'|'monthly'
│ is_active           BOOLEAN     │
│ next_run            TIMESTAMPTZ │
│ last_run            TIMESTAMPTZ │
│ created_at          TIMESTAMPTZ │
│ updated_at          TIMESTAMPTZ │
└──────────┬──────────────────────┘
           │ 1
           │
           │ n
┌──────────▼──────────────────────┐
│    cleanup_job_logs             │ ← NEW (v1.1.0)
├─────────────────────────────────┤
│ id (PK)             UUID        │
│ job_id (FK)         UUID        │ → cleanup_jobs.id (CASCADE DELETE)
│ deleted_count       INTEGER     │
│ executed_at         TIMESTAMPTZ │
│ status              VARCHAR(20) │ CHECK: 'success'|'failed'
│ error_message       TEXT        │
└─────────────────────────────────┘
```

---

## Table Descriptions

### **users**
**Purpose**: Authentication and user profiles

**Columns**:
- `id`: Primary key (UUID, auto-generated)
- `email`: Unique email address for login
- `password_hash`: bcrypt hashed password (never plain text)
- `name`: User's display name
- `preferences`: JSONB for flexible user preferences (theme, notifications, etc.)
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp

**Relationships**:
- `1:n` with `user_llm_settings`
- `1:n` with `chat_sessions`
- `1:n` with `memories` (implicit via application logic)

**Indexes**:
- Primary key on `id`
- Unique index on `email`

---

### **user_llm_settings**
**Purpose**: Per-user LLM provider and model preferences

**Columns**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users (CASCADE DELETE)
- `chat_provider`: LLM provider for chat ('openai', 'anthropic', 'ollama')
- `chat_model`: Model name for chat (e.g., 'gpt-4o')
- `chat_temperature`: Temperature for chat (0.0-2.0)
- `chat_max_tokens`: Max tokens for chat responses
- `chat_relevancy_score`: Min similarity score for RAG context (0.0-1.0)
- `search_provider`: LLM provider for search
- `search_model`: Model for search
- `search_temperature`: Temperature for search
- `search_max_tokens`: Max tokens for search
- `search_relevancy_score`: Min similarity for search results
- `classification_provider`: LLM for auto-categorization
- `classification_model`: Model for classification
- `classification_temperature`: Temperature for classification
- `classification_max_tokens`: Max tokens for classification
- `embedding_provider`: Provider for embeddings ('openai', 'ollama')
- `embedding_model`: Embedding model (e.g., 'text-embedding-3-small')

**Constraints**:
- UNIQUE on `user_id` (one settings record per user)
- CHECK constraints on provider values
- CHECK constraints on temperature (0-2)
- CHECK constraints on relevancy scores (0-1)

**Indexes**:
- `idx_user_llm_settings_user_id` on `user_id`

---

### **categories**
**Purpose**: Taxonomy for organizing memories

**Columns**:
- `id`: Primary key (SERIAL)
- `name`: Category name (UNIQUE)
- `description`: Text description of category purpose
- `color`: Hex color code for UI (e.g., '#f59e0b')
- `created_at`: Creation timestamp

**Default Categories** (seeded):
1. **Idea** - Creative ideas and inspirations (#f59e0b)
2. **Task** - Actionable tasks and to-dos (#ef4444)
3. **Project** - Project-related information (#8b5cf6)
4. **Reference** - Reference material and notes (#10b981)
5. **Journal** - Personal journal entries (#3b82f6)
6. **Meeting** - Meeting notes and summaries (#ec4899)
7. **Learning** - Learning resources and insights (#06b6d4)
8. **Unsorted** - Uncategorized items (#6b7280)

**Indexes**:
- Primary key on `id`
- Unique index on `name`

---

### **memories**
**Purpose**: Main content storage with AI-generated metadata and vector embeddings

**Columns**:
- `id`: Primary key (UUID)
- `raw_content`: Original text content (up to 10,000 chars)
- `structured_content`: JSONB with AI-extracted metadata:
  ```json
  {
    "summary": "Brief summary",
    "category": "Idea",
    "tags": ["ai", "product"],
    "sentiment": "positive",
    "priority": "high",
    "entities": ["John", "Q4 2024"]
  }
  ```
- `category`: Category name (defaults to 'Unsorted')
- `tags`: Array of tags (TEXT[])
- `embedding`: Vector representation (1536 dimensions) for semantic search
- `source`: Where the memory came from ('slack', 'manual', 'api')
- `slack_message_ts`: Slack message timestamp (if source is slack)
- `memory_date`: **NEW (v1.1.0)** - Date of the memory/event
- `due_date`: **NEW (v1.1.0)** - When task/item is due
- `received_date`: **NEW (v1.1.0)** - When item was received
- `memory_date_formatted`: **NEW (v1.1.0)** - Formatted as mm/dd/yy
- `due_date_formatted`: **NEW (v1.1.0)** - Formatted as mm/dd/yy
- `received_date_formatted`: **NEW (v1.1.0)** - Formatted as mm/dd/yy
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:
- Primary key on `id`
- `idx_memories_category` (B-tree) on `category`
- `idx_memories_tags` (GIN) on `tags` array
- `idx_memories_created_at` (B-tree DESC) on `created_at`
- `idx_memories_embedding` (IVFFlat) on `embedding` for vector similarity
- `idx_memories_due_date` (B-tree) on `due_date` **NEW (v1.1.0)**

**Triggers**:
- `update_memories_updated_at` - Auto-update `updated_at` on UPDATE

---

### **chat_sessions**
**Purpose**: RAG conversation sessions

**Columns**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users (CASCADE DELETE)
- `title`: Session title (auto-generated or user-defined)
- `created_at`: Session creation timestamp
- `updated_at`: Last message timestamp

**Relationships**:
- `n:1` with `users`
- `1:n` with `chat_messages`

**Indexes**:
- Primary key on `id`
- `idx_chat_sessions_user` on `user_id`

**Triggers**:
- `update_chat_sessions_updated_at` - Auto-update `updated_at` on UPDATE

---

### **chat_messages**
**Purpose**: Individual messages in RAG conversations

**Columns**:
- `id`: Primary key (UUID)
- `session_id`: Foreign key to chat_sessions (CASCADE DELETE)
- `role`: Message sender ('user', 'assistant', 'system')
- `content`: Message text
- `memory_context`: JSONB array of relevant memories used for RAG:
  ```json
  [
    {
      "id": "uuid",
      "raw_content": "...",
      "similarity": 0.89,
      "category": "Idea"
    }
  ]
  ```
- `created_at`: Message timestamp

**Constraints**:
- CHECK on `role` (must be 'user', 'assistant', or 'system')

**Indexes**:
- Primary key on `id`
- `idx_chat_messages_session` on `session_id`

---

### **schema_migrations**
**Purpose**: Track applied database migrations

**Columns**:
- `id`: Primary key (SERIAL)
- `migration_name`: Migration file name (UNIQUE)
- `applied_at`: When migration was applied
- `checksum`: Migration file checksum (for integrity)

**Usage**: Migration system uses this table to avoid re-running migrations

---

## Key Relationships

### User-Centric Model
```
users (1) → (n) chat_sessions → (n) chat_messages
users (1) → (1) user_llm_settings
users (1) → (n) memories (implicit)
```

### Memory System
```
categories (metadata) ← memories → chat_messages (context)
```

---

## Data Types

### PostgreSQL Extensions
- **pgvector**: Enables VECTOR(1536) type for embeddings

### Special Types
- **UUID**: Universally unique identifiers (gen_random_uuid())
- **VECTOR(1536)**: pgvector type for OpenAI embeddings
- **TEXT[]**: PostgreSQL array for tags
- **JSONB**: Binary JSON for structured_content, memory_context, preferences
- **TIMESTAMPTZ**: Timestamp with timezone

---

## Indexes Strategy

### B-tree Indexes (Standard)
- All primary keys (automatic)
- Foreign keys for joins
- `memories.created_at DESC` for recent queries
- `memories.category` for filtering

### GIN Indexes (Array/JSONB)
- `memories.tags` for array operations (`&&`, `@>`)

### IVFFlat Indexes (Vector)
- `memories.embedding` for cosine similarity search
- Lists: 100 (optimal for ~10k-100k vectors)
- Distance: Cosine (`<=>` operator)

**Performance Notes**:
- IVFFlat is approximate (99%+ recall typically)
- For exact search (< 10k rows), PostgreSQL will use sequential scan
- Rebuild index when data size 10x: `REINDEX INDEX idx_memories_embedding`

---

## Triggers & Functions

### update_updated_at_column()
**Purpose**: Auto-update `updated_at` timestamp on row UPDATE

**Applied To**:
- `memories`
- `users`
- `chat_sessions`
- `user_llm_settings`

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

---

## Constraints & Validation

### Foreign Key Cascade Rules
- `user_llm_settings.user_id` → `users.id` (ON DELETE CASCADE)
- `chat_sessions.user_id` → `users.id` (ON DELETE CASCADE)
- `chat_messages.session_id` → `chat_sessions.id` (ON DELETE CASCADE)

**Effect**: Deleting a user deletes all their sessions, messages, and settings

### CHECK Constraints
- `chat_messages.role` IN ('user', 'assistant', 'system')
- `user_llm_settings.chat_provider` IN ('openai', 'anthropic', 'ollama')
- `user_llm_settings.chat_temperature` BETWEEN 0 AND 2
- `user_llm_settings.chat_relevancy_score` BETWEEN 0 AND 1
- All `max_tokens` > 0

### UNIQUE Constraints
- `users.email`
- `categories.name`
- `user_llm_settings.user_id`
- `schema_migrations.migration_name`

---

## Storage Estimates

### Typical Row Sizes
- **users**: ~500 bytes (with JSONB preferences)
- **memories**: ~5-10 KB (text + 1536-dim vector)
- **chat_messages**: ~2-5 KB (text + JSONB context)
- **user_llm_settings**: ~1 KB

### Projected Growth
- **1,000 memories**: ~5-10 MB
- **10,000 memories**: ~50-100 MB
- **100,000 memories**: ~500 MB - 1 GB

**Note**: PostgreSQL performs well up to tens of millions of rows

---

## Database Configuration

### Connection Pooling
```javascript
// backend/src/db/index.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,        // Max connections
  min: 2,         // Min connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Recommended PostgreSQL Settings
```
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1  # For SSD
```

---

## Migration History

See `migrations-log.md` for detailed migration history and current schema version.

---

**Last Updated**: 2026-01-24  
**PostgreSQL Version**: 16  
**pgvector Version**: 0.5.1  
**Current Schema Version**: 002  
**Total Tables**: 7 (excluding schema_migrations)
