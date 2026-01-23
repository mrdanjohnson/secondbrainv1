import { Router } from 'express';
import { searchController } from '../controllers/search.js';

const router = Router();

// Semantic search
router.post('/semantic', searchController.semanticSearch);

// Simple text search
router.get('/', searchController.textSearch);

// Get search suggestions
router.get('/suggestions', searchController.getSuggestions);

export default router;
