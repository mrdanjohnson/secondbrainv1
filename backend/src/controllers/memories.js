import * as vectorService from '../services/vectorService.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { generateEmbedding, classifyAndStructure } from '../services/aiService.js';

export const memoriesController = {
  // Get all memories with filtering and pagination
  getMemories: asyncHandler(async (req, res) => {
    const {
      category,
      tags,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const memories = await vectorService.getMemories({
      category,
      tags: tags ? tags.split(',') : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: memories,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  }),

  // Get a single memory by ID
  getMemory: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const memory = await vectorService.getMemoryById(id);

    if (!memory) {
      throw new ApiError(404, 'Memory not found');
    }

    res.json({
      success: true,
      data: memory
    });
  }),

  // Create a new memory
  createMemory: asyncHandler(async (req, res) => {
    const { content, category, tags } = req.body;
    const userId = req.user.id;

    if (!content || typeof content !== 'string') {
      throw new ApiError(400, 'Content is required and must be a string');
    }

    // Generate embedding for the content
    const embedding = await generateEmbedding(content);

    // Classify and structure the content using AI
    let structuredData;
    try {
      structuredData = await classifyAndStructure(content);
    } catch (error) {
      console.warn('AI classification failed, using default values:', error.message);
      structuredData = {
        summary: content.slice(0, 200),
        category: category || 'Unsorted',
        tags: tags || [],
        sentiment: 'neutral',
        entities: []
      };
    }

    const memoryData = {
      raw_content: content,
      structured_content: structuredData,
      category: structuredData.category,
      tags: [...new Set([...structuredData.tags, ...(tags || [])])],
      embedding
    };

    const memory = await vectorService.createMemory(memoryData);

    res.status(201).json({
      success: true,
      message: 'Memory created successfully',
      data: memory
    });
  }),

  // Update a memory
  updateMemory: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, category, tags, structured_content } = req.body;

    // Check if memory exists
    const existing = await vectorService.getMemoryById(id);
    if (!existing) {
      throw new ApiError(404, 'Memory not found');
    }

    const updates = {};

    if (content !== undefined) {
      updates.raw_content = content;
      // Regenerate embedding if content changed
      updates.embedding = await generateEmbedding(content);
    }

    if (category !== undefined) {
      updates.category = category;
    }

    if (tags !== undefined) {
      updates.tags = tags;
    }

    if (structured_content !== undefined) {
      updates.structured_content = structured_content;
    }

    const memory = await vectorService.updateMemory(id, updates);

    res.json({
      success: true,
      message: 'Memory updated successfully',
      data: memory
    });
  }),

  // Delete a memory
  deleteMemory: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deleted = await vectorService.deleteMemory(id);

    if (!deleted) {
      throw new ApiError(404, 'Memory not found');
    }

    res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  }),

  // Get category statistics
  getStats: asyncHandler(async (req, res) => {
    const stats = await vectorService.getCategoryStats();
    const totalCount = await vectorService.getMemories({ limit: 10000 });
    
    res.json({
      success: true,
      data: {
        categories: stats,
        totalMemories: totalCount.length
      }
    });
  }),

  // Get recent memories
  getRecent: asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const memories = await vectorService.getRecentMemories(parseInt(limit));

    res.json({
      success: true,
      data: memories
    });
  }),

  // Bulk operations
  bulkClassify: asyncHandler(async (req, res) => {
    const { ids, category } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, 'IDs array is required');
    }

    if (!category) {
      throw new ApiError(400, 'Category is required');
    }

    const memories = await vectorService.bulkClassify(ids, category);

    res.json({
      success: true,
      message: `Updated ${memories.length} memories`,
      data: memories
    });
  }),

  bulkTag: asyncHandler(async (req, res) => {
    const { ids, tags, action = 'add' } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, 'IDs array is required');
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      throw new ApiError(400, 'Tags array is required');
    }

    const memories = await vectorService.bulkTag(ids, tags, action);

    res.json({
      success: true,
      message: `Updated tags for ${memories.length} memories`,
      data: memories
    });
  })
};

export default memoriesController;
