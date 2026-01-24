-- Migration: 002_add_llm_settings_table
-- Description: Add LLM Settings table for per-user AI preferences
-- Version: 1.0.0
-- Date: 2026-01-23

-- LLM Settings table for per-user AI preferences
CREATE TABLE IF NOT EXISTS user_llm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Settings for AI Chat feature
  chat_provider VARCHAR(20) DEFAULT 'openai' CHECK (chat_provider IN ('openai', 'anthropic', 'ollama')),
  chat_model VARCHAR(100) DEFAULT 'gpt-4o',
  chat_temperature NUMERIC(3, 2) DEFAULT 0.7 CHECK (chat_temperature >= 0 AND chat_temperature <= 2),
  chat_max_tokens INTEGER DEFAULT 2048 CHECK (chat_max_tokens > 0),
  chat_relevancy_score NUMERIC(3, 2) DEFAULT 0.3 CHECK (chat_relevancy_score >= 0 AND chat_relevancy_score <= 1),
  
  -- Settings for Search feature
  search_provider VARCHAR(20) DEFAULT 'openai' CHECK (search_provider IN ('openai', 'anthropic', 'ollama')),
  search_model VARCHAR(100) DEFAULT 'gpt-4o',
  search_temperature NUMERIC(3, 2) DEFAULT 0.3 CHECK (search_temperature >= 0 AND search_temperature <= 2),
  search_max_tokens INTEGER DEFAULT 1024 CHECK (search_max_tokens > 0),
  search_relevancy_score NUMERIC(3, 2) DEFAULT 0.5 CHECK (search_relevancy_score >= 0 AND search_relevancy_score <= 1),
  
  -- Settings for Classification/Auto-categorization
  classification_provider VARCHAR(20) DEFAULT 'openai' CHECK (classification_provider IN ('openai', 'anthropic', 'ollama')),
  classification_model VARCHAR(100) DEFAULT 'gpt-4o',
  classification_temperature NUMERIC(3, 2) DEFAULT 0.3 CHECK (classification_temperature >= 0 AND classification_temperature <= 2),
  classification_max_tokens INTEGER DEFAULT 512 CHECK (classification_max_tokens > 0),
  
  -- Embedding settings (for vector search)
  embedding_provider VARCHAR(20) DEFAULT 'openai' CHECK (embedding_provider IN ('openai', 'ollama')),
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One settings record per user
  UNIQUE(user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_llm_settings_user_id ON user_llm_settings(user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_llm_settings_updated_at
  BEFORE UPDATE ON user_llm_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing users
INSERT INTO user_llm_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_llm_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

