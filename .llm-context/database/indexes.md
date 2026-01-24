# Index Strategy - Second Brain Database

## Overview

This document details all indexes in the Second Brain database, their purpose, performance characteristics, and maintenance strategies.

---

## Index Summary Table

| Index Name | Table | Type | Columns | Size | Purpose |
|------------|-------|------|---------|------|---------|
| users_pkey | users | B-tree | id | ~100KB | Primary key |
| users_email_key | users | B-tree | email | ~100KB | Unique constraint + login lookup |
| idx_memories_category | memories | B-tree | category | ~500KB | Filter by category |
| idx_memories_tags | memories | GIN | tags | ~2MB | Tag array operations |
| idx_memories_created_at | memories | B-tree | created_at DESC | ~500KB | Recent memories |
| idx_memories_embedding | memories | IVFFlat | embedding | ~50MB | Vector similarity search |
| idx_chat_sessions_user | chat_sessions | B-tree | user_id | ~50KB | User's sessions |
| idx_chat_messages_session | chat_messages | B-tree | session_id | ~100KB | Session messages |
| idx_user_llm_settings_user_id | user_llm_settings | B-tree | user_id | ~10KB | Settings lookup |

**Note**: Sizes are estimates for 10,000 memories

---

## B-tree Indexes (Standard)

### Primary Keys (Automatic)

**All tables have automatic B-tree indexes on primary keys**:
- `users.id`
- `categories.id`
- `memories.id`
- `chat_sessions.id`
- `chat_messages.id`
- `user_llm_settings.id`

**Characteristics**:
- **Type**: B-tree (balanced tree)
- **Speed**: O(log n) lookups
- **Use Case**: Point lookups, range queries, sorting
- **Maintenance**: Automatic (PostgreSQL manages)

---

### idx_memories_category

```sql
CREATE INDEX idx_memories_category ON memories(category);
```

**Purpose**: Fast filtering by category

**Queries Optimized**:
```sql
SELECT * FROM memories WHERE category = 'Idea';
SELECT COUNT(*) FROM memories WHERE category = 'Task';
```

**Performance**:
- **Selectivity**: High (8 categories)
- **Size**: ~500KB for 10k memories
- **Speed**: Instant filtering

**When Used**: Automatically used when `WHERE category = ...`

---

### idx_memories_created_at

```sql
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
```

**Purpose**: Fast retrieval of recent memories

**Queries Optimized**:
```sql
SELECT * FROM memories ORDER BY created_at DESC LIMIT 20;
SELECT * FROM memories WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Performance**:
- **Direction**: DESC (descending) for recent-first queries
- **Size**: ~500KB for 10k memories
- **Speed**: O(1) for LIMIT queries (index-only scan)

**Key Feature**: Index includes sort order, no sorting needed

---

### idx_chat_sessions_user

```sql
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
```

**Purpose**: Get all sessions for a user

**Queries Optimized**:
```sql
SELECT * FROM chat_sessions WHERE user_id = $1;
```

**Performance**:
- **Selectivity**: Low (few sessions per user)
- **Size**: ~50KB
- **Speed**: Instant

---

### idx_chat_messages_session

```sql
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
```

**Purpose**: Get all messages in a session

**Queries Optimized**:
```sql
SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at;
```

**Performance**:
- **Selectivity**: Low (many messages per session)
- **Size**: ~100KB
- **Speed**: Very fast

---

## GIN Indexes (Inverted Indexes)

### idx_memories_tags

```sql
CREATE INDEX idx_memories_tags ON memories USING GIN(tags);
```

**Purpose**: Fast array operations on tags

**Type**: GIN (Generalized Inverted Index)

**Queries Optimized**:
```sql
-- Contains tag
SELECT * FROM memories WHERE 'ai' = ANY(tags);

-- Overlaps (OR)
SELECT * FROM memories WHERE tags && ARRAY['ai', 'ml']::TEXT[];

-- Contains all (AND)
SELECT * FROM memories WHERE tags @> ARRAY['ai', 'productivity']::TEXT[];

-- Get all unique tags
SELECT DISTINCT unnest(tags) FROM memories;
```

**Performance**:
- **Size**: ~2MB for 10k memories (stores all unique tags)
- **Speed**: Very fast (O(log n) for tag lookup)
- **Trade-off**: Slower inserts/updates (index rebuild)

**Operators Supported**:
- `&&` - Array overlap (OR)
- `@>` - Array contains (AND)
- `<@` - Array is contained by
- `=` - Array equality

**Maintenance**:
```sql
-- Rebuild if fragmented
REINDEX INDEX idx_memories_tags;

-- Check index bloat
SELECT pg_size_pretty(pg_relation_size('idx_memories_tags'));
```

---

## Vector Indexes (IVFFlat)

### idx_memories_embedding

```sql
CREATE INDEX idx_memories_embedding 
ON memories 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

**Purpose**: Fast approximate nearest neighbor search

**Type**: IVFFlat (Inverted File with Flat compression)

**Queries Optimized**:
```sql
-- K-nearest neighbors
SELECT * FROM memories
ORDER BY embedding <=> $1::vector
LIMIT 20;

-- With threshold
SELECT * FROM memories
WHERE 1 - (embedding <=> $1::vector) > 0.3
ORDER BY embedding <=> $1::vector
LIMIT 20;
```

**Distance Operators**:
- `<=>` - Cosine distance (used here)
- `<->` - L2 distance (Euclidean)
- `<#>` - Inner product

**Index Parameters**:
- **lists**: 100 (number of clusters)
  - Rule of thumb: `rows / 1000` for < 1M rows
  - 100 is optimal for 10k-100k vectors
  - Adjust when data grows 10x

**Performance**:
- **Size**: ~50MB for 10k vectors (1536 dimensions each)
- **Build Time**: ~30 seconds for 10k vectors
- **Query Time**: ~50-100ms for 20 results
- **Recall**: 99%+ (approximate, not exact)

**Trade-offs**:
- **Approximate**: Not guaranteed to find absolute best matches
- **Build Cost**: Expensive to build/rebuild
- **Memory**: Requires sufficient RAM

**When to Rebuild**:
```sql
-- After adding many new vectors (10x growth)
REINDEX INDEX idx_memories_embedding;

-- Or recreate with new parameters
DROP INDEX idx_memories_embedding;
CREATE INDEX idx_memories_embedding 
ON memories 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 1000);  -- Increased for 100k+ vectors
```

**Alternative: HNSW (Future)**
```sql
-- pgvector 0.5.0+ supports HNSW (better accuracy, faster queries)
CREATE INDEX idx_memories_embedding_hnsw
ON memories 
USING hnsw (embedding vector_cosine_ops);
```

---

## Unique Indexes (Constraints)

### users_email_key

```sql
CREATE UNIQUE INDEX users_email_key ON users(email);
```

**Purpose**: Enforce email uniqueness + fast login lookup

**Queries Optimized**:
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

**Performance**: O(log n) lookup, prevents duplicates

---

### user_llm_settings UNIQUE(user_id)

```sql
CREATE UNIQUE INDEX user_llm_settings_user_id_key 
ON user_llm_settings(user_id);
```

**Purpose**: One settings record per user

**Enforces**: Business logic constraint

---

## Index Maintenance

### Monitoring Index Health

```sql
-- Check index sizes
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Unused indexes (idx_scan = 0)
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%pkey'
  AND schemaname = 'public';
```

---

### Rebuilding Indexes

```sql
-- Rebuild all indexes on a table
REINDEX TABLE memories;

-- Rebuild specific index
REINDEX INDEX idx_memories_embedding;

-- Rebuild concurrently (no locks, PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_memories_tags;
```

**When to Rebuild**:
1. After bulk data changes
2. Index bloat (fragmentation)
3. Changing vector index parameters
4. After major version upgrade

---

### Vacuum and Analyze

```sql
-- Update statistics (important for query planner)
ANALYZE memories;

-- Full vacuum (reclaim space)
VACUUM FULL memories;

-- Auto vacuum (already enabled)
-- PostgreSQL does this automatically
```

---

## Index Best Practices

### 1. Index Selectivity

**High Selectivity** (good for indexes):
- `users.email` - Unique values
- `memories.id` - Unique values

**Low Selectivity** (bad for indexes):
- `memories.category` - Only 8 values
- Boolean columns - Only 2 values

**Exception**: `memories.category` index is still useful because:
- Frequently queried
- Reduces rows scanned significantly

---

### 2. Composite Indexes

**Consider** for frequent multi-column queries:
```sql
-- If you often query by user_id AND created_at
CREATE INDEX idx_memories_user_created 
ON memories(user_id, created_at DESC);
```

**Rule**: Most selective column first (usually)

---

### 3. Covering Indexes

**Include extra columns** to avoid table lookups:
```sql
-- Include commonly accessed columns
CREATE INDEX idx_memories_category_covering
ON memories(category) 
INCLUDE (id, raw_content, tags);
```

**Note**: PostgreSQL 11+ feature

---

### 4. Partial Indexes

**Index only subset of data**:
```sql
-- Only index recent memories
CREATE INDEX idx_memories_recent 
ON memories(created_at DESC)
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Only index non-null embeddings
CREATE INDEX idx_memories_embedding_exists
ON memories(embedding)
WHERE embedding IS NOT NULL;
```

**Benefits**: Smaller, faster indexes

---

## Query Plan Analysis

### EXPLAIN

```sql
-- See query plan
EXPLAIN 
SELECT * FROM memories WHERE category = 'Idea';

-- See actual execution
EXPLAIN ANALYZE
SELECT * FROM memories WHERE category = 'Idea';
```

**Look For**:
- `Index Scan` - Good (uses index)
- `Seq Scan` - Bad (full table scan)
- `Bitmap Index Scan` - Good (multiple index use)

**Example Output**:
```
Index Scan using idx_memories_category on memories
  Index Cond: (category = 'Idea'::text)
  Rows: 2500
  Cost: 0.29..85.32
```

---

## Performance Tuning

### Increase Index Cache

```sql
-- PostgreSQL config (postgresql.conf)
shared_buffers = 256MB          -- RAM for cache
effective_cache_size = 1GB      -- OS cache estimate
maintenance_work_mem = 64MB     -- For index builds
```

---

### Monitor Slow Queries

```sql
-- Enable slow query log (postgresql.conf)
log_min_duration_statement = 1000  -- Log queries > 1 second

-- Check pg_stat_statements (if installed)
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Future Index Optimizations

### Planned Indexes

```sql
-- Full-text search (future)
CREATE INDEX idx_memories_fts 
ON memories 
USING GIN(to_tsvector('english', raw_content));

-- Multi-column for complex queries
CREATE INDEX idx_memories_category_created
ON memories(category, created_at DESC);

-- Expression index for case-insensitive email
CREATE INDEX idx_users_email_lower
ON users(LOWER(email));
```

---

**Last Updated**: 2026-01-24  
**PostgreSQL Version**: 16  
**pgvector Version**: 0.5.1  
**Total Indexes**: 15 (including primary keys)
