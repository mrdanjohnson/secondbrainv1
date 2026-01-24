# Common Query Patterns - Second Brain Database

## Overview

This document contains frequently used SQL queries, optimization notes, and best practices for querying the Second Brain database.

---

## Memory Queries

### Get All Memories (Paginated)

```sql
-- Basic pagination
SELECT 
  id,
  raw_content,
  category,
  tags,
  created_at,
  updated_at
FROM memories
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

**Performance**: 
- Uses `idx_memories_created_at` index (DESC)
- Fast even with millions of rows

**Variations**:
```sql
-- Filter by category
SELECT * FROM memories
WHERE category = 'Idea'
ORDER BY created_at DESC
LIMIT 20;

-- Filter by tag
SELECT * FROM memories
WHERE tags && ARRAY['ai', 'productivity']::TEXT[]
ORDER BY created_at DESC
LIMIT 20;

-- Filter by date range
SELECT * FROM memories
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

### Get Recent Memories

```sql
SELECT 
  id,
  raw_content,
  category,
  tags,
  created_at
FROM memories
ORDER BY created_at DESC
LIMIT 10;
```

**Optimization**: Index on `created_at DESC` ensures fast retrieval

---

### Get Memory Statistics

```sql
-- Total count
SELECT COUNT(*) as total FROM memories;

-- Count by category
SELECT 
  category,
  COUNT(*) as count
FROM memories
GROUP BY category
ORDER BY count DESC;

-- This week's memories
SELECT COUNT(*) as this_week
FROM memories
WHERE created_at >= DATE_TRUNC('week', NOW());

-- This month's memories
SELECT COUNT(*) as this_month
FROM memories
WHERE created_at >= DATE_TRUNC('month', NOW());
```

**Performance Note**: For large tables, consider materialized views for statistics

---

### Semantic Search (Vector Similarity)

```sql
-- Find similar memories using cosine similarity
SELECT 
  id,
  raw_content,
  category,
  tags,
  created_at,
  1 - (embedding <=> $1::vector) AS similarity
FROM memories
WHERE 1 - (embedding <=> $1::vector) > $2
ORDER BY embedding <=> $1::vector
LIMIT $3;

-- Parameters:
-- $1: query embedding vector [1536 dimensions]
-- $2: minimum similarity threshold (e.g., 0.3)
-- $3: result limit (e.g., 20)
```

**Performance**:
- Uses `idx_memories_embedding` (IVFFlat index)
- Approximate search (99%+ recall)
- Fast for 10k-1M vectors

**Example Usage**:
```javascript
const queryEmbedding = await generateEmbedding(userQuery);
const results = await db.query(`
  SELECT 
    id,
    raw_content,
    1 - (embedding <=> $1::vector) AS similarity
  FROM memories
  WHERE 1 - (embedding <=> $1::vector) > 0.3
  ORDER BY embedding <=> $1::vector
  LIMIT 20
`, [JSON.stringify(queryEmbedding)]);
```

---

### Text Search (Simple)

```sql
-- Case-insensitive text search
SELECT *
FROM memories
WHERE LOWER(raw_content) LIKE LOWER('%' || $1 || '%')
ORDER BY created_at DESC
LIMIT 20;

-- Multiple terms (OR)
SELECT *
FROM memories
WHERE 
  raw_content ILIKE '%ai%'
  OR raw_content ILIKE '%machine learning%'
ORDER BY created_at DESC;
```

**Performance**: 
- Sequential scan (slow for large tables)
- Consider full-text search with tsvector for better performance

---

### Tag Queries

```sql
-- Memories with specific tag
SELECT *
FROM memories
WHERE 'productivity' = ANY(tags)
ORDER BY created_at DESC;

-- Memories with any of these tags (OR)
SELECT *
FROM memories
WHERE tags && ARRAY['ai', 'ml', 'data']::TEXT[]
ORDER BY created_at DESC;

-- Memories with all of these tags (AND)
SELECT *
FROM memories
WHERE tags @> ARRAY['ai', 'productivity']::TEXT[]
ORDER BY created_at DESC;

-- Most used tags
SELECT 
  unnest(tags) as tag,
  COUNT(*) as count
FROM memories
GROUP BY tag
ORDER BY count DESC
LIMIT 20;
```

**Performance**: 
- Uses `idx_memories_tags` (GIN index)
- Very fast for array operations

---

## Chat Queries

### Get User's Chat Sessions

```sql
SELECT 
  cs.id,
  cs.title,
  cs.created_at,
  cs.updated_at,
  COUNT(cm.id) as message_count
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
WHERE cs.user_id = $1
GROUP BY cs.id
ORDER BY cs.updated_at DESC;
```

**Performance**: 
- Uses `idx_chat_sessions_user`
- LEFT JOIN allows sessions with zero messages

---

### Get Session History with Messages

```sql
-- Get session with all messages
SELECT 
  cm.id as message_id,
  cm.role,
  cm.content,
  cm.memory_context,
  cm.created_at
FROM chat_messages cm
WHERE cm.session_id = $1
ORDER BY cm.created_at ASC;
```

**Performance**: Uses `idx_chat_messages_session`

---

### Get Latest Chat Message

```sql
SELECT *
FROM chat_messages
WHERE session_id = $1
ORDER BY created_at DESC
LIMIT 1;
```

---

## User Queries

### Get User with Settings

```sql
SELECT 
  u.*,
  s.chat_provider,
  s.chat_model,
  s.chat_temperature,
  s.embedding_provider,
  s.embedding_model
FROM users u
LEFT JOIN user_llm_settings s ON u.id = s.user_id
WHERE u.id = $1;
```

**Note**: LEFT JOIN in case settings don't exist yet

---

### Get or Create User Settings

```sql
-- Get settings
SELECT * FROM user_llm_settings WHERE user_id = $1;

-- Create if not exists
INSERT INTO user_llm_settings (user_id)
VALUES ($1)
ON CONFLICT (user_id) DO NOTHING
RETURNING *;
```

---

## Category Queries

### Get All Categories with Memory Counts

```sql
SELECT 
  c.id,
  c.name,
  c.description,
  c.color,
  COUNT(m.id) as memory_count
FROM categories c
LEFT JOIN memories m ON c.name = m.category
GROUP BY c.id
ORDER BY c.name;
```

**Performance**: May be slow with many memories, consider caching

---

## Bulk Operations

### Bulk Update Categories

```sql
-- Update category for multiple memories
UPDATE memories
SET 
  category = $1,
  updated_at = NOW()
WHERE id = ANY($2::UUID[]);
```

**Example**:
```javascript
await db.query(
  'UPDATE memories SET category = $1 WHERE id = ANY($2::UUID[])',
  ['Project', [uuid1, uuid2, uuid3]]
);
```

---

### Bulk Insert Memories

```sql
INSERT INTO memories (raw_content, category, tags, embedding, source)
VALUES 
  ($1, $2, $3, $4, $5),
  ($6, $7, $8, $9, $10),
  ($11, $12, $13, $14, $15)
RETURNING id, created_at;
```

**Better Approach** (using unnest):
```sql
INSERT INTO memories (raw_content, category, source)
SELECT * FROM unnest(
  ARRAY['content1', 'content2']::TEXT[],
  ARRAY['Idea', 'Task']::TEXT[],
  ARRAY['slack', 'slack']::TEXT[]
)
RETURNING *;
```

---

## Analytics Queries

### Memories Created Per Day (Last 30 Days)

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM memories
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### Most Active Users (Chat)

```sql
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(cs.id) as session_count,
  COUNT(cm.id) as message_count
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY u.id
ORDER BY message_count DESC
LIMIT 10;
```

---

### Average Similarity Scores

```sql
-- Average similarity for retrieved memories
SELECT 
  AVG((memory_context->0->>'similarity')::FLOAT) as avg_similarity
FROM chat_messages
WHERE memory_context IS NOT NULL
  AND jsonb_array_length(memory_context) > 0;
```

---

## Maintenance Queries

### Find Orphaned Embeddings

```sql
-- Memories without embeddings
SELECT COUNT(*) 
FROM memories 
WHERE embedding IS NULL;
```

---

### Find Large JSONB Objects

```sql
-- Find memories with large structured_content
SELECT 
  id,
  LENGTH(structured_content::TEXT) as size_bytes
FROM memories
WHERE structured_content IS NOT NULL
ORDER BY size_bytes DESC
LIMIT 20;
```

---

### Database Size

```sql
-- Total database size
SELECT pg_size_pretty(pg_database_size('secondbrain'));

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index sizes
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

---

## Optimization Tips

### 1. Use Prepared Statements

```javascript
// Good: Prevents SQL injection, allows query plan caching
const result = await db.query(
  'SELECT * FROM memories WHERE id = $1',
  [memoryId]
);

// Bad: SQL injection risk, no plan caching
const result = await db.query(
  `SELECT * FROM memories WHERE id = '${memoryId}'`
);
```

---

### 2. Limit Result Sets

```sql
-- Always use LIMIT for large tables
SELECT * FROM memories LIMIT 100;

-- Use pagination for UI
SELECT * FROM memories ORDER BY created_at DESC LIMIT 20 OFFSET 40;
```

---

### 3. Use Indexes

```sql
-- Check if query uses indexes
EXPLAIN ANALYZE
SELECT * FROM memories WHERE category = 'Idea';

-- Look for "Index Scan" (good) vs "Seq Scan" (bad)
```

---

### 4. Avoid SELECT *

```sql
-- Good: Only select needed columns
SELECT id, raw_content, created_at FROM memories;

-- Bad: Fetches embedding (24KB per row!)
SELECT * FROM memories;
```

---

### 5. Connection Pooling

```javascript
// Use connection pooling (already configured)
import db from '../db/index.js';

// Don't create new clients for each query
```

---

## Common Performance Issues

### Slow Vector Search

**Symptom**: Semantic search takes > 1 second

**Diagnosis**:
```sql
EXPLAIN ANALYZE
SELECT * FROM memories
ORDER BY embedding <=> $1::vector
LIMIT 20;
```

**Solutions**:
1. Rebuild index: `REINDEX INDEX idx_memories_embedding;`
2. Increase IVFFlat lists parameter
3. Use HNSW index (pgvector 0.5.0+)

---

### Slow Tag Queries

**Symptom**: Tag filtering is slow

**Check**:
```sql
EXPLAIN ANALYZE
SELECT * FROM memories WHERE tags && ARRAY['ai']::TEXT[];
```

**Ensure**: GIN index exists on `tags` column

---

### Out of Memory (OOM)

**Cause**: Fetching too many embeddings at once

**Solution**:
```sql
-- Don't fetch embeddings unless needed
SELECT id, raw_content, category, tags
FROM memories
-- (exclude embedding column)
```

---

**Last Updated**: 2026-01-24  
**Optimized For**: PostgreSQL 16 + pgvector 0.5.1  
**Query Examples**: Production-tested patterns
