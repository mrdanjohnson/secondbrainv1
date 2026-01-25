/**
 * Cleanup Cron Job
 * Runs periodically to execute scheduled cleanup jobs
 */

import cron from 'node-cron';
import * as cleanupService from '../services/cleanupService.js';

let cronJob = null;

/**
 * Initialize the cleanup cron job
 * Runs every hour to check for scheduled cleanup jobs
 */
export function initializeCleanupCron() {
  // Run every hour at minute 0
  cronJob = cron.schedule('0 * * * *', async () => {
    console.log('[CLEANUP CRON] Running scheduled cleanup jobs check...');
    
    try {
      const results = await cleanupService.runAllScheduledJobs();
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);
      
      console.log(`[CLEANUP CRON] Completed: ${successCount} successful, ${errorCount} errors, ${totalDeleted} total memories deleted`);
      
      if (errorCount > 0) {
        console.error('[CLEANUP CRON] Jobs with errors:', results.filter(r => !r.success));
      }
    } catch (error) {
      console.error('[CLEANUP CRON] Error running scheduled jobs:', error);
    }
  });
  
  console.log('[CLEANUP CRON] Initialized - will run every hour');
  
  return cronJob;
}

/**
 * Stop the cleanup cron job
 */
export function stopCleanupCron() {
  if (cronJob) {
    cronJob.stop();
    console.log('[CLEANUP CRON] Stopped');
  }
}

/**
 * Manually trigger a cron run (for testing)
 */
export async function manualTrigger() {
  console.log('[CLEANUP CRON] Manual trigger initiated...');
  const results = await cleanupService.runAllScheduledJobs();
  return results;
}

export default {
  initializeCleanupCron,
  stopCleanupCron,
  manualTrigger
};
