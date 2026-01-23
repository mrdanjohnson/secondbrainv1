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
  const { content, source = 'webhook', metadata } = req.body;

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }

  const embedding = await generateEmbedding(content);
  const structuredData = await classifyAndStructure(content);

  const memory = await vectorService.createMemory({
    raw_content: content,
    structured_content: structuredData,
    category: structuredData.category,
    tags: structuredData.tags,
    embedding,
    source,
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
