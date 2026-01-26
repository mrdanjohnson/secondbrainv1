-- Migration: 006_remove_user_embedding_settings
-- Description: Remove per-user embedding settings (embeddings must be system-wide)
-- Version: 1.0.0
-- Date: 2026-01-26

-- Rationale:
-- Vector embeddings must use the same model system-wide for similarity search to work
-- Per-user embedding models would create incompatible vector spaces
-- Embedding model is now a global system setting via environment variables

ALTER TABLE user_llm_settings
DROP COLUMN IF EXISTS embedding_provider,
DROP COLUMN IF EXISTS embedding_model;
