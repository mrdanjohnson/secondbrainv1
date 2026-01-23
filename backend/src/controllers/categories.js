import { query } from '../db/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const categoriesController = {
  // Get all categories
  getCategories: asyncHandler(async (req, res) => {
    const categories = await query(
      'SELECT * FROM categories ORDER BY name',
      []
    );

    // Get count for each category
    const statsResult = await query(
      `SELECT category, COUNT(*) as count 
       FROM memories 
       GROUP BY category`,
      []
    );

    const stats = Object.fromEntries(
      statsResult.rows.map(row => [row.category, parseInt(row.count)])
    );

    res.json({
      success: true,
      data: categories.rows.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        memoryCount: stats[cat.name] || 0
      }))
    });
  }),

  // Get single category
  getCategory: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Category not found');
    }

    const cat = result.rows[0];

    res.json({
      success: true,
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        color: cat.color
      }
    });
  }),

  // Create category
  createCategory: asyncHandler(async (req, res) => {
    const { name, description, color } = req.body;

    if (!name) {
      throw new ApiError(400, 'Category name is required');
    }

    // Check if exists
    const existing = await query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existing.rows.length > 0) {
      throw new ApiError(409, 'Category with this name already exists');
    }

    const result = await query(
      `INSERT INTO categories (name, description, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, color || '#3b82f6']
    );

    const cat = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        color: cat.color
      }
    });
  }),

  // Update category
  updateCategory: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const result = await query(
      `UPDATE categories 
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           color = COALESCE($4, color)
       WHERE id = $1
       RETURNING *`,
      [id, name, description, color]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Category not found');
    }

    const cat = result.rows[0];

    res.json({
      success: true,
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        color: cat.color
      }
    });
  }),

  // Delete category
  deleteCategory: asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if category has memories
    const catResult = await query(
      'SELECT name FROM categories WHERE id = $1',
      [id]
    );

    if (catResult.rows.length === 0) {
      throw new ApiError(404, 'Category not found');
    }

    const categoryName = catResult.rows[0].name;

    const countResult = await query(
      'SELECT COUNT(*) as count FROM memories WHERE category = $1',
      [categoryName]
    );

    if (parseInt(countResult.rows[0].count) > 0) {
      throw new ApiError(400, 'Cannot delete category with memories. Move or delete memories first.');
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  })
};

export default categoriesController;
