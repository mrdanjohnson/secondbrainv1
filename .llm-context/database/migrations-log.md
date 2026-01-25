# Database Migrations Log - Second Brain

## Migration System

Second Brain uses a custom migration system built with Node.js. Migrations are tracked in the `schema_migrations` table.

### Migration Commands

```bash
# Check migration status
npm run db:status

# Apply pending migrations
npm run db:migrate

# Dry run (preview SQL without applying)
npm run db:migrate:dry

# Rollback last migration
npm run db:migrate:undo

# First-time setup (creates DB + runs init.sql)
npm run db:setup
```

---

## Migration History

### **005_add_cleanup_jobs_table** (Latest)
**Applied**: 2026-01-25  
**File**: `backend/src/db/migrations/005_add_cleanup_jobs_table.js`  
**Status**: ✅ Applied

**Changes**:
- Created `cleanup_jobs` table for automated memory deletion
- Created `cleanup_job_logs` table for execution tracking
- Added indexes:
  - `idx_cleanup_jobs_user` on `user_id`
  - `idx_cleanup_jobs_next_run` on `next_run`
  - `idx_cleanup_job_logs_job` on `job_id`
  - `idx_cleanup_job_logs_executed` on `executed_at`

**Reason**: Enable scheduled cleanup of old memories based on date/category/tag filters

**Rollback**: Drop tables `cleanup_jobs` and `cleanup_job_logs`

**Data Impact**: None - new feature, no existing data affected

---

### **004_add_additional_date_fields**
**Applied**: 2026-01-25  
**File**: `backend/src/db/migrations/004_add_additional_date_fields.js`  
**Status**: ✅ Applied

**Changes**:
- Added columns to `memories` table:
  - `memory_date` (TIMESTAMP WITH TIME ZONE)
  - `due_date` (TIMESTAMP WITH TIME ZONE)
  - `received_date` (TIMESTAMP WITH TIME ZONE)
  - `memory_date_formatted` (VARCHAR(10))
  - `due_date_formatted` (VARCHAR(10))
  - `received_date_formatted` (VARCHAR(10))
- Created index `idx_memories_due_date` on `due_date`

**Reason**: Support multiple date types for memories with natural language parsing and search

**Rollback**: Drop added columns and index

**Data Impact**: Existing memories unaffected - new columns nullable

---

### **001_initial_schema** (Initial)
**Applied**: 2026-01-01 (Project initialization)  
**File**: `backend/src/db/migrations/001_initial_schema.js`  
**Status**: ✅ Applied

**Changes**:
- Created `users` table
- Created `categories` table with 8 default categories
- Created `memories` table with VECTOR(1536) support
- Created `chat_sessions` table
- Created `chat_messages` table
- Created `update_updated_at_column()` function
- Created triggers for auto-updating `updated_at`
- Created indexes:
  - `idx_memories_category` (B-tree)
  - `idx_memories_tags` (GIN)
  - `idx_memories_created_at` (B-tree DESC)
  - `idx_memories_embedding` (IVFFlat)
  - `idx_chat_sessions_user` (B-tree)
  - `idx_chat_messages_session` (B-tree)

**Tables Created**: 5
- users
- categories
- memories
- chat_sessions
- chat_messages

**Rollback**: Not supported (initial schema)

---

### **002_add_llm_settings_table**
**Applied**: 2026-01-23  
**File**: `backend/src/db/migrations/002_add_llm_settings_table.js`  
**Status**: ✅ Applied

**Changes**:
- Created `user_llm_settings` table
- Added columns for chat, search, classification, and embedding settings
- Added CHECK constraints for provider values
- Added CHECK constraints for temperature (0-2)
- Added CHECK constraints for relevancy scores (0-1)
- Created UNIQUE constraint on `user_id`
- Created index `idx_user_llm_settings_user_id`
- Created trigger `update_user_llm_settings_updated_at`
- Backfilled default settings for existing users

**Tables Created**: 1
- user_llm_settings

**SQL Summary**:
```sql
CREATE TABLE user_llm_settings (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  chat_provider VARCHAR(20) DEFAULT 'openai',
  chat_model VARCHAR(100) DEFAULT 'gpt-4o',
  chat_temperature NUMERIC(3, 2) DEFAULT 0.7,
  chat_max_tokens INTEGER DEFAULT 2048,
  chat_relevancy_score NUMERIC(3, 2) DEFAULT 0.3,
  search_provider VARCHAR(20) DEFAULT 'openai',
  search_model VARCHAR(100) DEFAULT 'gpt-4o',
  search_temperature NUMERIC(3, 2) DEFAULT 0.3,
  search_max_tokens INTEGER DEFAULT 1024,
  search_relevancy_score NUMERIC(3, 2) DEFAULT 0.5,
  classification_provider VARCHAR(20) DEFAULT 'openai',
  classification_model VARCHAR(100) DEFAULT 'gpt-4o',
  classification_temperature NUMERIC(3, 2) DEFAULT 0.3,
  classification_max_tokens INTEGER DEFAULT 512,
  embedding_provider VARCHAR(20) DEFAULT 'openai',
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Rollback SQL**:
```sql
DROP TRIGGER IF EXISTS update_user_llm_settings_updated_at ON user_llm_settings;
DROP INDEX IF EXISTS idx_user_llm_settings_user_id;
DROP TABLE IF EXISTS user_llm_settings;
```

---

## Current Schema Version

**Version**: 002  
**Last Migration**: 002_add_llm_settings_table  
**Total Tables**: 7 (excluding schema_migrations)

---

## Pending Migrations

**Status**: No pending migrations

---

## Migration Best Practices

### Creating New Migrations

1. **Naming Convention**: `{number}_{description}.js`
   - Example: `003_add_tags_index.js`

2. **Migration File Structure**:
```javascript
// 003_example_migration.js
export const up = async (db) => {
  await db.query(`
    -- SQL statements here
    CREATE TABLE example (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    );
  `);
};

export const down = async (db) => {
  await db.query(`
    DROP TABLE IF EXISTS example;
  `);
};

export const description = 'Add example table';
```

3. **Always Include**:
   - `up()` function (apply changes)
   - `down()` function (rollback changes)
   - `description` string

4. **Testing**:
```bash
# Dry run first
npm run db:migrate:dry

# Apply migration
npm run db:migrate

# Test rollback
npm run db:migrate:undo

# Re-apply
npm run db:migrate
```

### Rules

1. **Never Modify Existing Migrations**: Once applied, migrations are immutable
2. **Always Test Rollback**: Ensure `down()` function works
3. **Use Transactions**: Migrations run in transactions (automatic)
4. **Idempotent**: Use `IF NOT EXISTS`, `IF EXISTS` clauses
5. **Separate Concerns**: One migration per logical change
6. **Data Migrations**: Keep schema and data migrations separate

---

## Migration Debugging

### Check Status
```bash
npm run db:status
```

**Output Example**:
```
Migration Status
================
✓ 001_initial_schema (applied 2026-01-01)
✓ 002_add_llm_settings_table (applied 2026-01-23)
```

### View Migration Table
```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

**Output**:
```
 id |       migration_name       |        applied_at         | checksum
----+----------------------------+---------------------------+----------
  2 | 002_add_llm_settings_table | 2026-01-23 10:30:15+00    | abc123
  1 | 001_initial_schema         | 2026-01-01 08:00:00+00    | initial
```

### Manual Rollback (Emergency)
```sql
-- DO NOT USE unless migration system is broken
BEGIN;

-- Reverse migration changes manually
DROP TABLE user_llm_settings;

-- Remove from migrations table
DELETE FROM schema_migrations WHERE migration_name = '002_add_llm_settings_table';

COMMIT;
```

---

## Planned Migrations (Future)

### 003_add_memory_sharing (Planned)
**Purpose**: Enable sharing memories with other users  
**Changes**:
- Add `shared_memories` table
- Add `memory_shares` junction table
- Add indexes for performance

### 004_add_full_text_search (Planned)
**Purpose**: Improve text search performance  
**Changes**:
- Add `search_vector` column to memories (tsvector)
- Create GIN index on `search_vector`
- Create trigger to auto-update search vector

### 005_add_memory_attachments (Planned)
**Purpose**: Support file attachments  
**Changes**:
- Add `attachments` table
- Add foreign key to memories
- Add storage path and metadata columns

---

## Database Backup & Restore

### Backup Before Migration
```bash
# Full database backup
pg_dump -U secondbrain -d secondbrain -F c -f backup_$(date +%Y%m%d).dump

# Schema only
pg_dump -U secondbrain -d secondbrain -s -f schema_$(date +%Y%m%d).sql

# Data only
pg_dump -U secondbrain -d secondbrain -a -f data_$(date +%Y%m%d).sql
```

### Restore
```bash
# Restore full backup
pg_restore -U secondbrain -d secondbrain backup_20260124.dump

# Restore SQL backup
psql -U secondbrain -d secondbrain -f schema_20260124.sql
```

---

## Migration Failures

### Common Issues

**Issue**: Migration fails mid-execution  
**Solution**: Transaction is automatically rolled back, safe to re-run

**Issue**: Constraint violation during data migration  
**Solution**: Fix data first, then re-run migration

**Issue**: Migration applied but not recorded in schema_migrations  
**Solution**: Manually insert record:
```sql
INSERT INTO schema_migrations (migration_name, checksum)
VALUES ('002_add_llm_settings_table', 'checksum_here');
```

**Issue**: Table already exists  
**Solution**: Use `CREATE TABLE IF NOT EXISTS` in migrations

---

## Version Control

All migration files are committed to git in:
```
backend/src/db/migrations/
├── 001_initial_schema.js
├── 002_add_llm_settings_table.js
└── (future migrations...)
```

**Never**:
- Delete migration files
- Modify applied migrations
- Skip migration numbers

**Always**:
- Test migrations locally first
- Create rollback scripts
- Document changes in this log

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Test migration on staging environment
- [ ] Backup production database
- [ ] Review migration SQL
- [ ] Estimate downtime (if any)
- [ ] Test rollback procedure

### Deployment Steps
```bash
# 1. Backup
pg_dump -U secondbrain -d secondbrain -F c -f backup_pre_migration.dump

# 2. Dry run
npm run db:migrate:dry

# 3. Apply migration
npm run db:migrate

# 4. Verify
npm run db:status
psql -U secondbrain -d secondbrain -c "\dt"
```

### Post-Deployment
- [ ] Verify application still works
- [ ] Check error logs
- [ ] Monitor database performance
- [ ] Update documentation

---

**Last Updated**: 2026-01-24  
**Current Version**: 002  
**Next Planned Migration**: TBD  
**Migration System**: Custom Node.js (backend/src/db/migrate.js)
