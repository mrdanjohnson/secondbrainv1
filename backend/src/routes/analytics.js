import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get timeline statistics
router.get('/timeline', analyticsController.getTimeline);

// Get category distribution
router.get('/categories', analyticsController.getCategoryDistribution);

// Get busiest times
router.get('/busiest', analyticsController.getBusiestTimes);

// Get due date statistics
router.get('/duedates', analyticsController.getDueDateStats);

// Get summary statistics
router.get('/summary', analyticsController.getSummaryStats);

export default router;
