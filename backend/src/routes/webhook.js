import { Router } from 'express';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { generateEmbedding, classifyAndStructure } from '../services/aiService.js';
import * as vectorService from '../services/vectorService.js';

const router = Router();

// N8N webhook for processing Slack messages
router.post('/slack', asyncHandler(async (req, res) => {
  const { text, user, timestamp, channel } = req.body;

  if (!text) {
    return res.status(200).json({ message: 'No text to process' });
  }

  try {
    // Generate embedding
    const embedding = await generateEmbedding(text);

    // Classify content
    const structuredData = await classifyAndStructure(text);

    // Store in database
    const memory = await vectorService.createMemory({
      raw_content: text,
      structured_content: structuredData,
      category: structuredData.category,
      tags: structuredData.tags,
      embedding,
      source: 'slack',
      slack_message_ts: timestamp
    });

    console.log(`Processed Slack message: ${memory.id}`);

    res.json({
      success: true,
      memory_id: memory.id,
      category: structuredData.category,
      tags: structuredData.tags
    });
  } catch (error) {
    console.error('Error processing Slack webhook:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
}));

// Generic webhook for other integrations
router.post('/generic', asyncHandler(async (req, res) => {
  const { 
    content, 
    source = 'webhook', 
    source_id, 
    // Support both camelCase (from n8n) and snake_case
    memory_date, memoryDate,
    due_date, dueDate,
    received_date, receivedDate,
    category, 
    tags, 
    metadata 
  } = req.body;

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }

  // Check for duplicate using source_id
  if (source_id) {
    const existing = await vectorService.findBySourceId(source, source_id);
    if (existing) {
      console.log(`Duplicate memory skipped: ${source}:${source_id}`);
      return res.json({ 
        success: true, 
        message: 'Duplicate memory skipped',
        data: existing
      });
    }
  }

  const embedding = await generateEmbedding(content);
  const structuredData = await classifyAndStructure(content);

  const memory = await vectorService.createMemory({
    raw_content: content,
    structured_content: structuredData,
    category: category || structuredData.category,
    tags: tags || structuredData.tags,
    embedding,
    source,
    source_id,
    memory_date: memory_date || memoryDate || new Date().toISOString(),
    due_date: due_date || dueDate,
    received_date: received_date || receivedDate,
    slack_message_ts: metadata?.timestamp
  });

  res.json({
    success: true,
    data: memory
  });
}));

// Health check for webhook endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'webhook' });
});

export default router;
