/**
 * Cleanup Service for Second Brain
 * Handles automated memory deletion based on filters and schedules
 */

import { query } from '../db/index.js';
import { normalizeDate, parseRelativeDate, formatToMMDDYY } from '../utils/dateUtils.js';

/**
 * Execute a cleanup job
 */
export async function executeCleanupJob(jobId, executionType = 'scheduled', userId = null) {
  try {
    // Get job configuration
    const jobResult = await query(
      'SELECT * FROM cleanup_jobs WHERE id = $1',
      [jobId]
    );
    
    if (jobResult.rows.length === 0) {
      throw new Error('Cleanup job not found');
    }
    
    const job = jobResult.rows[0];
    
    if (!job.is_active && executionType === 'scheduled') {
      console.log(`Skipping inactive job: ${job.name}`);
      return { deleted: 0, skipped: true };
    }
    
    // Build delete query based on filters
    const { sql, params } = buildDeleteQuery(job);
    
    console.log(`Executing cleanup job "${job.name}":`, sql, params);
    
    // Execute deletion
    const result = await query(sql, params);
    const deletedIds = result.rows.map(r => r.id);
    const deletedCount = deletedIds.length;
    
    // Log execution
    await query(
      `INSERT INTO cleanup_job_logs 
        (job_id, deleted_count, execution_type, status, deleted_memory_ids)
       VALUES ($1, $2, $3, $4, $5)`,
      [jobId, deletedCount, executionType, 'success', deletedIds]
    );
    
    // Update job stats
    await query(
      `UPDATE cleanup_jobs 
       SET last_run = NOW(),
           next_run = $1,
           last_deleted_count = $2,
           total_deleted_count = total_deleted_count + $2,
           updated_at = NOW()
       WHERE id = $3`,
      [calculateNextRun(job), deletedCount, jobId]
    );
    
    console.log(`Cleanup job "${job.name}" deleted ${deletedCount} memories`);
    
    return { deleted: deletedCount, deletedIds };
  } catch (error) {
    console.error(`Error executing cleanup job ${jobId}:`, error);
    
    // Log error
    await query(
      `INSERT INTO cleanup_job_logs 
        (job_id, deleted_count, execution_type, status, error_message)
       VALUES ($1, 0, $2, $3, $4)`,
      [jobId, executionType, 'error', error.message]
    );
    
    throw error;
  }
}

/**
 * Build SQL query for deletion based on job filters
 */
function buildDeleteQuery(job) {
  let whereConditions = [];
  let params = [];
  let paramIndex = 1;
  
  // Date filtering
  if (job.filter_type === 'date' || job.filter_type === 'combined') {
    if (job.date_field && job.date_value) {
      let compareDate;
      
      // Check if relative or absolute date
      if (job.date_value.includes('day') || job.date_value.includes('week') || job.date_value.includes('month')) {
        compareDate = parseRelativeDate(job.date_value);
      } else {
        compareDate = normalizeDate(job.date_value);
      }
      
      if (compareDate) {
        const formattedDate = formatToMMDDYY(compareDate);
        
        switch (job.date_operator) {
          case 'before':
            whereConditions.push(`${job.date_field} < $${paramIndex}`);
            params.push(formattedDate);
            paramIndex++;
            break;
          case 'after':
            whereConditions.push(`${job.date_field} > $${paramIndex}`);
            params.push(formattedDate);
            paramIndex++;
            break;
          case 'equals':
            whereConditions.push(`${job.date_field} = $${paramIndex}`);
            params.push(formattedDate);
            paramIndex++;
            break;
        }
      }
    }
  }
  
  // Tag filtering
  if (job.filter_type === 'tag' || job.filter_type === 'combined') {
    if (job.tags && job.tags.length > 0) {
      whereConditions.push(`tags && $${paramIndex}::text[]`);
      params.push(job.tags);
      paramIndex++;
    }
  }
  
  // Category filtering
  if (job.filter_type === 'category' || job.filter_type === 'combined') {
    if (job.categories && job.categories.length > 0) {
      whereConditions.push(`category = ANY($${paramIndex}::text[])`);
      params.push(job.categories);
      paramIndex++;
    }
  }
  
  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';
  
  const sql = `DELETE FROM memories ${whereClause} RETURNING id`;
  
  return { sql, params };
}

/**
 * Calculate next run time based on schedule
 */
export function calculateNextRun(job) {
  if (job.schedule === 'manual') {
    return null;
  }
  
  const now = new Date();
  const scheduleTime = job.schedule_time || '02:00:00';
  const [hours, minutes, seconds] = scheduleTime.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, seconds || 0, 0);
  
  switch (job.schedule) {
    case 'daily':
      // If today's scheduled time has passed, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const targetDay = job.schedule_day_of_week || 0; // Default Sunday
      nextRun.setDate(nextRun.getDate() + ((7 + targetDay - nextRun.getDay()) % 7));
      
      // If that's today but time has passed, schedule for next week
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }
      break;
      
    case 'monthly':
      const targetDayOfMonth = job.schedule_day_of_month || 1;
      nextRun.setDate(targetDayOfMonth);
      
      // If that's passed this month, schedule for next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }
  
  return nextRun;
}

/**
 * Preview what would be deleted (dry run)
 */
export async function previewCleanup(jobConfig) {
  const { sql, params } = buildDeleteQuery(jobConfig);
  
  // Change DELETE to SELECT to preview
  const previewSql = sql.replace(
    'DELETE FROM memories', 
    'SELECT id, raw_content, category, tags, memory_date_formatted, due_date_formatted, received_date_formatted FROM memories'
  );
  
  const result = await query(previewSql, params);
  
  return {
    count: result.rows.length,
    memories: result.rows
  };
}

/**
 * Run all scheduled cleanup jobs
 */
export async function runAllScheduledJobs() {
  const result = await query(
    `SELECT id FROM cleanup_jobs 
     WHERE is_active = true 
     AND schedule != 'manual'
     AND (next_run IS NULL OR next_run <= NOW())
     ORDER BY next_run ASC`
  );
  
  const results = [];
  
  for (const row of result.rows) {
    try {
      const jobResult = await executeCleanupJob(row.id, 'scheduled');
      results.push({ jobId: row.id, success: true, ...jobResult });
    } catch (error) {
      console.error(`Error running cleanup job ${row.id}:`, error);
      results.push({ jobId: row.id, success: false, error: error.message });
    }
  }
  
  console.log(`Cleanup cron: Processed ${results.length} jobs`);
  
  return results;
}

/**
 * Get all cleanup jobs
 */
export async function getAllJobs(userId = null) {
  const sql = userId
    ? 'SELECT * FROM cleanup_jobs WHERE created_by = $1 ORDER BY created_at DESC'
    : 'SELECT * FROM cleanup_jobs ORDER BY created_at DESC';
  
  const params = userId ? [userId] : [];
  const result = await query(sql, params);
  
  return result.rows;
}

/**
 * Get cleanup job logs
 */
export async function getJobLogs(jobId, limit = 50) {
  const result = await query(
    `SELECT * FROM cleanup_job_logs 
     WHERE job_id = $1 
     ORDER BY executed_at DESC 
     LIMIT $2`,
    [jobId, limit]
  );
  
  return result.rows;
}

/**
 * Create cleanup job
 */
export async function createJob(jobData, userId = null) {
  const {
    name,
    description,
    filter_type,
    date_field,
    date_operator,
    date_value,
    tags,
    categories,
    schedule,
    schedule_time,
    schedule_day_of_week,
    schedule_day_of_month,
    is_active = true
  } = jobData;
  
  const result = await query(
    `INSERT INTO cleanup_jobs 
      (name, description, filter_type, date_field, date_operator, date_value, 
       tags, categories, schedule, schedule_time, schedule_day_of_week, 
       schedule_day_of_month, is_active, created_by, next_run)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      name, description, filter_type, date_field, date_operator, date_value,
      tags || null, categories || null, schedule, schedule_time || '02:00:00',
      schedule_day_of_week || null, schedule_day_of_month || null,
      is_active, userId, calculateNextRun({ schedule, schedule_time, schedule_day_of_week, schedule_day_of_month })
    ]
  );
  
  return result.rows[0];
}

/**
 * Update cleanup job
 */
export async function updateJob(jobId, updates) {
  const allowedFields = [
    'name', 'description', 'filter_type', 'date_field', 'date_operator', 
    'date_value', 'tags', 'categories', 'schedule', 'schedule_time',
    'schedule_day_of_week', 'schedule_day_of_month', 'is_active'
  ];
  
  const setStatements = [];
  const params = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setStatements.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  if (setStatements.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  setStatements.push(`updated_at = NOW()`);
  params.push(jobId);
  
  const result = await query(
    `UPDATE cleanup_jobs 
     SET ${setStatements.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );
  
  if (result.rows.length === 0) {
    throw new Error('Cleanup job not found');
  }
  
  // Recalculate next run if schedule changed
  const job = result.rows[0];
  await query(
    'UPDATE cleanup_jobs SET next_run = $1 WHERE id = $2',
    [calculateNextRun(job), jobId]
  );
  
  return result.rows[0];
}

/**
 * Delete cleanup job
 */
export async function deleteJob(jobId) {
  const result = await query(
    'DELETE FROM cleanup_jobs WHERE id = $1 RETURNING id',
    [jobId]
  );
  
  return result.rowCount > 0;
}
