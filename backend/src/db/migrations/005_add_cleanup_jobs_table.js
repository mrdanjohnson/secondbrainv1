-- Migration: 005_add_cleanup_jobs_table
-- Description: Add cleanup jobs table for automated memory deletion
-- Version: 1.0.0
-- Date: 2026-01-25

-- Create cleanup jobs table
CREATE TABLE IF NOT EXISTS cleanup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filter_type VARCHAR(50) NOT NULL,
  date_field VARCHAR(50),
  date_operator VARCHAR(10),
  date_value VARCHAR(50),
  tags TEXT[],
  categories TEXT[],
  schedule VARCHAR(20) NOT NULL,
  schedule_time TIME DEFAULT '02:00:00',
  schedule_day_of_week INTEGER,
  schedule_day_of_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  last_deleted_count INTEGER DEFAULT 0,
  total_deleted_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job execution logs table
CREATE TABLE IF NOT EXISTS cleanup_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES cleanup_jobs(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_count INTEGER NOT NULL,
  execution_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  deleted_memory_ids UUID[]
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cleanup_jobs_active ON cleanup_jobs(is_active, next_run);
CREATE INDEX IF NOT EXISTS idx_cleanup_jobs_schedule ON cleanup_jobs(schedule);
CREATE INDEX IF NOT EXISTS idx_cleanup_job_logs_job_id ON cleanup_job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_cleanup_job_logs_executed_at ON cleanup_job_logs(executed_at DESC);

