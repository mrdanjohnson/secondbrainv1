import axios from 'axios';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

/**
 * Ollama Service for local LLM integration
 * Provides methods to interact with Ollama API
 */

/**
 * Get list of all available (downloaded) models in Ollama
 * @returns {Promise<Array>} List of model objects
 */
export async function listOllamaModels() {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`, {
      timeout: 5000
    });
    
    return response.data.models || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.warn('Ollama service not available');
      return [];
    }
    console.error('Error listing Ollama models:', error.message);
    throw new Error('Failed to list Ollama models');
  }
}

/**
 * Check if Ollama service is available
 * @returns {Promise<boolean>}
 */
export async function checkOllamaHealth() {
  try {
    await axios.get(`${OLLAMA_API_URL}/api/tags`, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate chat completion using Ollama
 * @param {Array} messages - Chat messages
 * @param {Array} context - Additional context (memories)
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Response with content and usage
 */
export async function chatWithOllama(messages, context = [], options = {}) {
  const {
    model = 'llama3.2',
    temperature = 0.7,
    max_tokens = 2048
  } = options;

  try {
    // Build system prompt with context
    const systemPrompt = `You are an AI assistant helping the user interact with their "Second Brain" - a personal knowledge management system.

${context.length > 0 ? `Here are some relevant memories from the user's Second Brain that you should use as context:
${context.map(m => `- ${m.rawContent || m.raw_content} (Category: ${m.category}, Tags: ${m.tags?.join(', ') || 'none'})`).join('\n')}` : ''}

Your role is to:
1. Answer questions based on the context provided
2. Help the user find and organize their memories
3. Suggest connections between different pieces of information
4. Be concise and helpful

If you don't have enough context to answer a question, acknowledge that and ask for clarification.`;

    // Convert messages to Ollama format
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const response = await axios.post(
      `${OLLAMA_API_URL}/api/chat`,
      {
        model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature,
          num_predict: max_tokens
        }
      },
      { timeout: 120000 } // 2 minute timeout for generation
    );

    return {
      content: response.data.message.content,
      usage: {
        prompt_tokens: response.data.prompt_eval_count || 0,
        completion_tokens: response.data.eval_count || 0,
        total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
      },
      model: response.data.model
    };
  } catch (error) {
    console.error('Error generating Ollama chat response:', error.message);
    throw new Error('Failed to generate chat response with Ollama');
  }
}

/**
 * Generate text embedding using Ollama
 * @param {string} text - Text to embed
 * @param {string} model - Embedding model to use
 * @returns {Promise<Array>} Embedding vector
 */
export async function generateOllamaEmbedding(text, model = 'nomic-embed-text') {
  try {
    const response = await axios.post(
      `${OLLAMA_API_URL}/api/embeddings`,
      {
        model,
        prompt: text.slice(0, 8000) // Limit input length
      },
      { timeout: 30000 }
    );

    return response.data.embedding;
  } catch (error) {
    console.error('Error generating Ollama embedding:', error.message);
    throw new Error('Failed to generate embedding with Ollama');
  }
}

/**
 * Pull (download) a model from Ollama library
 * @param {string} modelName - Name of model to pull
 * @returns {Promise<Object>} Pull status
 */
export async function pullOllamaModel(modelName) {
  try {
    const response = await axios.post(
      `${OLLAMA_API_URL}/api/pull`,
      { name: modelName },
      { timeout: 300000 } // 5 minute timeout for large downloads
    );

    return { success: true, model: modelName };
  } catch (error) {
    console.error('Error pulling Ollama model:', error.message);
    throw new Error(`Failed to pull model: ${modelName}`);
  }
}

/**
 * Delete a model from Ollama
 * @param {string} modelName - Name of model to delete
 * @returns {Promise<Object>} Delete status
 */
export async function deleteOllamaModel(modelName) {
  try {
    await axios.delete(`${OLLAMA_API_URL}/api/delete`, {
      data: { name: modelName }
    });

    return { success: true, model: modelName };
  } catch (error) {
    console.error('Error deleting Ollama model:', error.message);
    throw new Error(`Failed to delete model: ${modelName}`);
  }
}

/**
 * Get recommended Ollama models for different use cases
 * @returns {Object} Categorized model recommendations
 */
export function getRecommendedOllamaModels() {
  return {
    chat: [
      { name: 'llama3.2', size: '2GB', description: 'Fast, efficient for chat' },
      { name: 'llama3.2:3b', size: '2GB', description: 'Lightweight, good for simple tasks' },
      { name: 'llama3.1:8b', size: '4.7GB', description: 'Balanced performance' },
      { name: 'smollm2:1.7b', size: '1GB', description: 'Very fast inference, resource-constrained' },
      { name: 'deepseek-r1:1.5b', size: '900MB', description: 'Optimized for reasoning tasks' },
      { name: 'qwen2.5:0.5b', size: '500MB', description: 'Smallest model, lightning-fast' },
      { name: 'mistral', size: '4.1GB', description: 'Good reasoning capabilities' },
      { name: 'mixtral:8x7b', size: '26GB', description: 'High performance, requires more resources' }
    ],
    embeddings: [
      { name: 'nomic-embed-text', size: '274MB', description: 'High quality embeddings' },
      { name: 'mxbai-embed-large', size: '669MB', description: 'Large, accurate embeddings' }
    ],
    classification: [
      { name: 'llama3.2:3b', size: '2GB', description: 'Fast classification' },
      { name: 'qwen2.5:0.5b', size: '500MB', description: 'Ultra-lightweight classification' },
      { name: 'phi3', size: '2.3GB', description: 'Efficient for structured tasks' }
    ]
  };
}

export default {
  listOllamaModels,
  checkOllamaHealth,
  chatWithOllama,
  generateOllamaEmbedding,
  pullOllamaModel,
  deleteOllamaModel,
  getRecommendedOllamaModels
};
