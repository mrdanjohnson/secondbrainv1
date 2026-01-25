import { Router } from 'express';
import { cleanupController } from '../controllers/cleanup.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all cleanup jobs
router.get('/jobs', cleanupController.getAllJobs);

// Get single cleanup job
router.get('/jobs/:id', cleanupController.getJob);

// Create cleanup job
router.post('/jobs', cleanupController.createJob);

// Update cleanup job
router.put('/jobs/:id', cleanupController.updateJob);

// Delete cleanup job
router.delete('/jobs/:id', cleanupController.deleteJob);

// Run cleanup job manually
router.post('/jobs/:id/run', cleanupController.runJob);

// Preview cleanup job
router.post('/preview', cleanupController.previewJob);

// Get job execution logs
router.get('/jobs/:id/logs', cleanupController.getJobLogs);

export default router;
