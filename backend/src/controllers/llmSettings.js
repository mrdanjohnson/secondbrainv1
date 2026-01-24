import { asyncHandler } from '../middleware/errorHandler.js';
import db from '../db/index.js';
import * as ollamaService from '../services/ollamaService.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Get LLM settings for authenticated user
 * Creates default settings if none exist
 */
export const getLLMSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let result = await db.query(
    'SELECT * FROM user_llm_settings WHERE user_id = $1',
    [userId]
  );

  // Create default settings if none exist
  if (result.rows.length === 0) {
    const insertResult = await db.query(
      'INSERT INTO user_llm_settings (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    result = insertResult;
  }

  const settings = result.rows[0];

  res.json({
    success: true,
    data: {
      id: settings.id,
      chat: {
        provider: settings.chat_provider,
        model: settings.chat_model,
        temperature: parseFloat(settings.chat_temperature),
        maxTokens: settings.chat_max_tokens,
        relevancyScore: parseFloat(settings.chat_relevancy_score)
      },
      search: {
        provider: settings.search_provider,
        model: settings.search_model,
        temperature: parseFloat(settings.search_temperature),
        maxTokens: settings.search_max_tokens,
        relevancyScore: parseFloat(settings.search_relevancy_score)
      },
      classification: {
        provider: settings.classification_provider,
        model: settings.classification_model,
        temperature: parseFloat(settings.classification_temperature),
        maxTokens: settings.classification_max_tokens
      },
      embedding: {
        provider: settings.embedding_provider,
        model: settings.embedding_model
      }
    }
  });
});

/**
 * Update LLM settings for authenticated user
 */
export const updateLLMSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { chat, search, classification, embedding } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  if (chat) {
    if (chat.provider) {
      updates.push(`chat_provider = $${paramCount++}`);
      values.push(chat.provider);
    }
    if (chat.model) {
      updates.push(`chat_model = $${paramCount++}`);
      values.push(chat.model);
    }
    if (chat.temperature !== undefined) {
      updates.push(`chat_temperature = $${paramCount++}`);
      values.push(chat.temperature);
    }
    if (chat.maxTokens !== undefined) {
      updates.push(`chat_max_tokens = $${paramCount++}`);
      values.push(chat.maxTokens);
    }
    if (chat.relevancyScore !== undefined) {
      updates.push(`chat_relevancy_score = $${paramCount++}`);
      values.push(chat.relevancyScore);
    }
  }

  if (search) {
    if (search.provider) {
      updates.push(`search_provider = $${paramCount++}`);
      values.push(search.provider);
    }
    if (search.model) {
      updates.push(`search_model = $${paramCount++}`);
      values.push(search.model);
    }
    if (search.temperature !== undefined) {
      updates.push(`search_temperature = $${paramCount++}`);
      values.push(search.temperature);
    }
    if (search.maxTokens !== undefined) {
      updates.push(`search_max_tokens = $${paramCount++}`);
      values.push(search.maxTokens);
    }
    if (search.relevancyScore !== undefined) {
      updates.push(`search_relevancy_score = $${paramCount++}`);
      values.push(search.relevancyScore);
    }
  }

  if (classification) {
    if (classification.provider) {
      updates.push(`classification_provider = $${paramCount++}`);
      values.push(classification.provider);
    }
    if (classification.model) {
      updates.push(`classification_model = $${paramCount++}`);
      values.push(classification.model);
    }
    if (classification.temperature !== undefined) {
      updates.push(`classification_temperature = $${paramCount++}`);
      values.push(classification.temperature);
    }
    if (classification.maxTokens !== undefined) {
      updates.push(`classification_max_tokens = $${paramCount++}`);
      values.push(classification.maxTokens);
    }
  }

  if (embedding) {
    if (embedding.provider) {
      updates.push(`embedding_provider = $${paramCount++}`);
      values.push(embedding.provider);
    }
    if (embedding.model) {
      updates.push(`embedding_model = $${paramCount++}`);
      values.push(embedding.model);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No settings to update'
    });
  }

  values.push(userId);
  const query = `
    UPDATE user_llm_settings 
    SET ${updates.join(', ')}
    WHERE user_id = $${paramCount}
    RETURNING *
  `;

  const result = await db.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Settings not found'
    });
  }

  const settings = result.rows[0];

  res.json({
    success: true,
    data: {
      chat: {
        provider: settings.chat_provider,
        model: settings.chat_model,
        temperature: parseFloat(settings.chat_temperature),
        maxTokens: settings.chat_max_tokens,
        relevancyScore: parseFloat(settings.chat_relevancy_score)
      },
      search: {
        provider: settings.search_provider,
        model: settings.search_model,
        temperature: parseFloat(settings.search_temperature),
        maxTokens: settings.search_max_tokens,
        relevancyScore: parseFloat(settings.search_relevancy_score)
      },
      classification: {
        provider: settings.classification_provider,
        model: settings.classification_model,
        temperature: parseFloat(settings.classification_temperature),
        maxTokens: settings.classification_max_tokens
      },
      embedding: {
        provider: settings.embedding_provider,
        model: settings.embedding_model
      }
    }
  });
});

/**
 * Get available models for each LLM provider
 */
export const getAvailableModels = asyncHandler(async (req, res) => {
  const models = {
    openai: {
      chat: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, multimodal' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous flagship' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and economical' }
      ],
      embeddings: [
        { id: 'text-embedding-3-small', name: 'Embedding 3 Small', description: '1536 dimensions, efficient' },
        { id: 'text-embedding-3-large', name: 'Embedding 3 Large', description: '3072 dimensions, high quality' },
        { id: 'text-embedding-ada-002', name: 'Ada 002', description: 'Legacy embedding model' }
      ]
    },
    anthropic: {
      chat: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Most intelligent model' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Balanced performance' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Previous flagship' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and compact' }
      ]
    },
    ollama: {
      chat: [],
      embeddings: []
    }
  };

  // Get Ollama models if available
  try {
    const ollamaModels = await ollamaService.listOllamaModels();
    
    models.ollama.chat = ollamaModels
      .filter(m => !m.name.includes('embed'))
      .map(m => ({
        id: m.name,
        name: m.name,
        description: `Size: ${formatBytes(m.size)}`,
        size: m.size,
        modified: m.modified_at
      }));

    models.ollama.embeddings = ollamaModels
      .filter(m => m.name.includes('embed'))
      .map(m => ({
        id: m.name,
        name: m.name,
        description: `Size: ${formatBytes(m.size)}`,
        size: m.size,
        modified: m.modified_at
      }));

    models.ollama.recommended = ollamaService.getRecommendedOllamaModels();
  } catch (error) {
    console.warn('Could not fetch Ollama models:', error.message);
  }

  res.json({
    success: true,
    data: models
  });
});

/**
 * Get Ollama service status and available models
 */
export const getOllamaStatus = asyncHandler(async (req, res) => {
  const isHealthy = await ollamaService.checkOllamaHealth();
  
  if (!isHealthy) {
    return res.json({
      success: true,
      data: {
        available: false,
        models: [],
        recommended: ollamaService.getRecommendedOllamaModels()
      }
    });
  }

  const models = await ollamaService.listOllamaModels();

  res.json({
    success: true,
    data: {
      available: true,
      models: models.map(m => ({
        name: m.name,
        size: formatBytes(m.size),
        sizeBytes: m.size,
        modified: m.modified_at,
        digest: m.digest
      })),
      recommended: ollamaService.getRecommendedOllamaModels()
    }
  });
});

/**
 * Pull (download) an Ollama model
 */
export const pullOllamaModel = asyncHandler(async (req, res) => {
  const { modelName } = req.body;

  if (!modelName) {
    return res.status(400).json({
      success: false,
      message: 'Model name is required'
    });
  }

  // This can take a while, so we should implement streaming or job queue
  // For now, return immediate response and pull in background
  res.json({
    success: true,
    message: `Pulling model ${modelName}. This may take several minutes.`,
    model: modelName
  });

  // Pull model in background (in production, use a job queue)
  ollamaService.pullOllamaModel(modelName)
    .then(() => console.log(`Successfully pulled model: ${modelName}`))
    .catch(err => console.error(`Failed to pull model ${modelName}:`, err.message));
});

/**
 * Delete an Ollama model
 */
export const deleteOllamaModel = asyncHandler(async (req, res) => {
  const { modelName } = req.params;

  await ollamaService.deleteOllamaModel(modelName);

  res.json({
    success: true,
    message: `Model ${modelName} deleted successfully`
  });
});

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default {
  getLLMSettings,
  updateLLMSettings,
  getAvailableModels,
  getOllamaStatus,
  pullOllamaModel,
  deleteOllamaModel
};
