-- Migration: 004_add_additional_date_fields
-- Description: Add due_date, received_date and their formatted versions
-- Version: 1.0.0
-- Date: 2026-01-25

-- Add new date fields
ALTER TABLE memories ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS received_date TIMESTAMP WITH TIME ZONE;

-- Add formatted date fields (mm/dd/yy)
ALTER TABLE memories ADD COLUMN IF NOT EXISTS memory_date_formatted VARCHAR(10);
ALTER TABLE memories ADD COLUMN IF NOT EXISTS due_date_formatted VARCHAR(10);
ALTER TABLE memories ADD COLUMN IF NOT EXISTS received_date_formatted VARCHAR(10);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_memories_due_date 
  ON memories(due_date DESC) WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memories_received_date 
  ON memories(received_date DESC) WHERE received_date IS NOT NULL;

-- Add indexes for formatted dates (for cleanup filtering)
CREATE INDEX IF NOT EXISTS idx_memories_memory_date_formatted 
  ON memories(memory_date_formatted) WHERE memory_date_formatted IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memories_due_date_formatted 
  ON memories(due_date_formatted) WHERE due_date_formatted IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memories_received_date_formatted 
  ON memories(received_date_formatted) WHERE received_date_formatted IS NOT NULL;

