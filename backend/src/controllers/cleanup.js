import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import * as cleanupService from '../services/cleanupService.js';

export const cleanupController = {
  // Get all cleanup jobs
  getAllJobs: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const jobs = await cleanupService.getAllJobs(userId);
    
    res.json({
      success: true,
      data: jobs
    });
  }),

  // Get a single cleanup job
  getJob: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const jobs = await cleanupService.getAllJobs();
    const job = jobs.find(j => j.id === id);
    
    if (!job) {
      throw new ApiError(404, 'Cleanup job not found');
    }
    
    res.json({
      success: true,
      data: job
    });
  }),

  // Create a new cleanup job
  createJob: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const jobData = req.body;
    
    // Validate required fields
    if (!jobData.name) {
      throw new ApiError(400, 'Job name is required');
    }
    
    if (!jobData.filter_type) {
      throw new ApiError(400, 'Filter type is required');
    }
    
    if (!jobData.schedule) {
      throw new ApiError(400, 'Schedule is required');
    }
    
    const job = await cleanupService.createJob(jobData, userId);
    
    res.status(201).json({
      success: true,
      message: 'Cleanup job created successfully',
      data: job
    });
  }),

  // Update a cleanup job
  updateJob: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const job = await cleanupService.updateJob(id, updates);
    
    res.json({
      success: true,
      message: 'Cleanup job updated successfully',
      data: job
    });
  }),

  // Delete a cleanup job
  deleteJob: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const deleted = await cleanupService.deleteJob(id);
    
    if (!deleted) {
      throw new ApiError(404, 'Cleanup job not found');
    }
    
    res.json({
      success: true,
      message: 'Cleanup job deleted successfully'
    });
  }),

  // Run a cleanup job manually
  runJob: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await cleanupService.executeCleanupJob(id, 'manual', userId);
    
    res.json({
      success: true,
      message: `Cleanup job executed successfully. Deleted ${result.deleted} memories.`,
      data: {
        deletedCount: result.deleted,
        deletedIds: result.deletedIds
      }
    });
  }),

  // Preview what would be deleted
  previewJob: asyncHandler(async (req, res) => {
    const jobConfig = req.body;
    
    const preview = await cleanupService.previewCleanup(jobConfig);
    
    res.json({
      success: true,
      data: {
        count: preview.count,
        memories: preview.memories
      }
    });
  }),

  // Get job execution logs
  getJobLogs: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const logs = await cleanupService.getJobLogs(id, parseInt(limit));
    
    res.json({
      success: true,
      data: logs
    });
  })
};

export default cleanupController;
