-- ============================================================================
-- Second Brain - Database Initialization Script
-- ============================================================================
-- This script runs automatically on first PostgreSQL container startup
-- when using Docker Compose with a fresh data volume.
--
-- For subsequent updates, use the migration system:
--   npm run db:setup      # First-time setup
--   npm run db:migrate    # Apply pending migrations
--   npm run db:status     # Check migration status
-- ============================================================================

-- Wait for database to be fully ready (PostgreSQL does this automatically)

-- Enable required extensions
SELECT pg_advisory_lock(0);  -- Prevent concurrent initialization

DO $$
BEGIN
    -- Create pgvector extension if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE EXTENSION vector;
        RAISE NOTICE 'pgvector extension created';
    ELSE
        RAISE NOTICE 'pgvector extension already exists';
    END IF;
END $$;

-- Create schema_migrations table for tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(100) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64)
);

-- Check if already initialized
DO $$
DECLARE
    migration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migration_count FROM schema_migrations;

    IF migration_count > 0 THEN
        RAISE NOTICE 'Database already initialized with % migrations', migration_count;
    ELSE
        RAISE NOTICE 'Running initial schema setup...';
    END IF;
END $$;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories for organizing memories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main memories table with vector embeddings
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_content TEXT NOT NULL,
    structured_content JSONB,
    category VARCHAR(100) DEFAULT 'Unsorted',
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(1536),
    source VARCHAR(50) DEFAULT 'slack',
    slack_message_ts VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions for RAG conversations
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages with context
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    memory_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Memory indexes
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- ============================================================================
-- Default Data
-- ============================================================================

-- Insert default categories (ignore if already exists)
INSERT INTO categories (name, description, color) VALUES
    ('Idea', 'Creative ideas and inspirations', '#f59e0b'),
    ('Task', 'Actionable tasks and to-dos', '#ef4444'),
    ('Project', 'Project-related information', '#8b5cf6'),
    ('Reference', 'Reference material and notes', '#10b981'),
    ('Journal', 'Personal journal entries', '#3b82f6'),
    ('Meeting', 'Meeting notes and summaries', '#ec4899'),
    ('Learning', 'Learning resources and insights', '#06b6d4'),
    ('Unsorted', 'Uncategorized items', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
CREATE TRIGGER update_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Record Initial Migration
-- ============================================================================

DO $$
DECLARE
    migration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migration_count FROM schema_migrations WHERE migration_name = '001_initial_schema';

    IF migration_count = 0 THEN
        INSERT INTO schema_migrations (migration_name, checksum)
        VALUES ('001_initial_schema', 'initial');
        RAISE NOTICE 'Migration 001_initial_schema recorded';
    ELSE
        RAISE NOTICE 'Migration 001_initial_schema already recorded';
    END IF;
END $$;

SELECT pg_advisory_unlock(0);  -- Release lock

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name != 'schema_migrations';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database initialization complete!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Categories loaded: 8';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Start the backend service to run API migrations';
    RAISE NOTICE '2. Access the application at http://localhost:5173';
    RAISE NOTICE '========================================';
END $$;
