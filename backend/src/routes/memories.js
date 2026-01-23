import { Router } from 'express';
import { memoriesController } from '../controllers/memories.js';

const router = Router();

// Get all memories with filtering
router.get('/', memoriesController.getMemories);

// Get recent memories
router.get('/recent', memoriesController.getRecent);

// Get statistics
router.get('/stats', memoriesController.getStats);

// Get single memory
router.get('/:id', memoriesController.getMemory);

// Create new memory
router.post('/', memoriesController.createMemory);

// Update memory
router.put('/:id', memoriesController.updateMemory);

// Delete memory
router.delete('/:id', memoriesController.deleteMemory);

// Bulk operations
router.post('/bulk/classify', memoriesController.bulkClassify);
router.post('/bulk/tag', memoriesController.bulkTag);

export default router;
