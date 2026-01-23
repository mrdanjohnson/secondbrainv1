import { Router } from 'express';
import { categoriesController } from '../controllers/categories.js';

const router = Router();

// Get all categories
router.get('/', categoriesController.getCategories);

// Get single category
router.get('/:id', categoriesController.getCategory);

// Create category
router.post('/', categoriesController.createCategory);

// Update category
router.put('/:id', categoriesController.updateCategory);

// Delete category
router.delete('/:id', categoriesController.deleteCategory);

export default router;
