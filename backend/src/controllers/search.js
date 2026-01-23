import * as vectorService from '../services/vectorService.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { generateEmbedding } from '../services/aiService.js';

export const searchController = {
  // Semantic search using vector similarity
  semanticSearch: asyncHandler(async (req, res) => {
    const { query, limit = 10, category, tags, threshold = 0.5 } = req.body;

    if (!query || typeof query !== 'string') {
      throw new ApiError(400, 'Search query is required');
    }

    const results = await vectorService.searchMemoriesByText(query, {
      limit: parseInt(limit),
      category,
      tags: tags ? tags.split(',') : undefined,
      threshold: parseFloat(threshold)
    });

    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length
      }
    });
  }),

  // Simple text search (fallback when vectors unavailable)
  textSearch: asyncHandler(async (req, res) => {
    const { q, limit = 20, offset = 0, category } = req.query;

    if (!q) {
      throw new ApiError(400, 'Search query (q) is required');
    }

    const memories = await vectorService.getMemories({
      category,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Simple text filtering (for fallback)
    const searchLower = q.toLowerCase();
    const filtered = memories.filter(m => 
      m.rawContent.toLowerCase().includes(searchLower) ||
      m.category.toLowerCase().includes(searchLower) ||
      m.tags.some(t => t.toLowerCase().includes(searchLower))
    );

    res.json({
      success: true,
      data: {
        query: q,
        results: filtered,
        count: filtered.length
      }
    });
  }),

  // Get search suggestions based on existing tags and categories
  getSuggestions: asyncHandler(async (req, res) => {
    const categories = await vectorService.getCategories();
    const stats = await vectorService.getCategoryStats();

    // Extract unique tags from recent memories
    const memories = await vectorService.getRecentMemories(100);
    const allTags = [...new Set(memories.flatMap(m => m.tags))].slice(0, 20);

    res.json({
      success: true,
      data: {
        categories: categories.map(c => ({
          name: c.name,
          color: c.color,
          count: stats.find(s => s.category === c.name)?.count || 0
        })),
        popularTags: allTags
      }
    });
  })
};

export default searchController;
