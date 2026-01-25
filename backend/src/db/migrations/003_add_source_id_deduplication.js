-- Migration: 003_add_source_id_deduplication
-- Description: Add source_id for deduplication and memory_date for temporal tracking
-- Version: 1.0.0
-- Date: 2026-01-24

-- Add source_id column for deduplication
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS source_id VARCHAR(255);

-- Add memory_date column for when the memory occurred
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS memory_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster source_id lookups
CREATE INDEX IF NOT EXISTS idx_memories_source_id 
ON memories(source, source_id) 
WHERE source_id IS NOT NULL;

-- Create index for date sorting and filtering
CREATE INDEX IF NOT EXISTS idx_memories_date 
ON memories(memory_date DESC) 
WHERE memory_date IS NOT NULL;

-- Add unique constraint to prevent duplicates from same source
ALTER TABLE memories 
ADD CONSTRAINT unique_source_memory 
UNIQUE (source, source_id);

