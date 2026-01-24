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
 * Models are optimized for RAG (Retrieval-Augmented Generation) with Second Brain context
 * @returns {Object} Categorized model recommendations
 */
export function getRecommendedOllamaModels() {
  return {
    chat: [
      // Recommended for RAG/Chat (good quality-to-performance ratio)
      { 
        name: 'llama3.2:3b', 
        size: '2GB', 
        description: 'Minimum size for decent RAG performance - Good instruction following, handles context well'
      },
      { 
        name: 'llama3.1:8b', 
        size: '4.7GB', 
        description: 'Better quality, good balance - Excellent for chat with context, strong reasoning'
      },
      { 
        name: 'qwen2.5:7b', 
        size: '4.7GB', 
        description: 'Excellent instruction following - Very good at using provided context accurately'
      },
      { 
        name: 'mistral:7b-instruct', 
        size: '4.1GB', 
        description: 'Strong at following context - Reliable for RAG, good reasoning capabilities'
      },
      
      // Premium options (if you have hardware)
      { 
        name: 'qwen2.5:14b', 
        size: '9GB', 
        description: 'Great middle ground - Significantly better quality, still reasonable resource usage'
      },
      { 
        name: 'llama3.1:70b', 
        size: '40GB', 
        description: 'Excellent quality (requires 40GB+ RAM) - Near GPT-4 level for context understanding'
      },
      { 
        name: 'mixtral:8x7b', 
        size: '26GB', 
        description: 'High performance mixture-of-experts - Excellent reasoning, requires 32GB+ RAM'
      },
      
      // NOT recommended for RAG (too small, high hallucination)
      { 
        name: 'smollm2:1.7b', 
        size: '1GB', 
        description: '⚠️ Too small for RAG - High hallucination rate, ignores context, for testing only'
      },
      { 
        name: 'qwen2.5:0.5b', 
        size: '500MB', 
        description: '⚠️ Not suitable for Second Brain - Cannot handle complex prompts or long context'
      }
    ],
    embeddings: [
      { 
        name: 'nomic-embed-text', 
        size: '274MB', 
        description: 'High quality embeddings - 768 dimensions, excellent for semantic search'
      },
      { 
        name: 'mxbai-embed-large', 
        size: '669MB', 
        description: 'Large, accurate embeddings - 1024 dimensions, best quality for retrieval'
      },
      { 
        name: 'all-minilm', 
        size: '46MB', 
        description: 'Lightweight embeddings - 384 dimensions, fast but lower quality'
      }
    ],
    classification: [
      { 
        name: 'llama3.2:3b', 
        size: '2GB', 
        description: 'Fast classification - Good for categorizing memories and extracting tags'
      },
      { 
        name: 'qwen2.5:7b', 
        size: '4.7GB', 
        description: 'Better accuracy - More reliable category assignments, fewer mistakes'
      },
      { 
        name: 'phi3:mini', 
        size: '2.3GB', 
        description: 'Efficient for structured tasks - Optimized for JSON output and tagging'
      }
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
