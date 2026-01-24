import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db/index.js';
import * as ollamaService from './ollamaService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Classification schema for AI responses
const CLASSIFICATION_SCHEMA = {
  type: 'json_object',
  json_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'A brief 1-2 sentence summary of the content'
      },
      category: {
        type: 'string',
        enum: ['Idea', 'Task', 'Project', 'Reference', 'Journal', 'Meeting', 'Learning', 'Unsorted'],
        description: 'The category that best fits the content'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Relevant tags for this content (3-5 tags)'
      },
      sentiment: {
        type: 'string',
        enum: ['positive', 'neutral', 'negative'],
        description: 'Overall sentiment of the content'
      },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Priority level if applicable'
      },
      entities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Named entities, people, places, or organizations mentioned'
      }
    },
    required: ['summary', 'category', 'tags', 'sentiment']
  }
};

/**
 * Get user's LLM settings from database
 * @param {string} userId - User ID
 * @param {string} area - Area name (chat, search, classification, embedding)
 * @returns {Promise<Object>} Settings for the specified area
 */
export async function getUserSettings(userId, area) {
  try {
    const result = await db.query(
      'SELECT * FROM user_llm_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return defaults if no settings exist
      return getDefaultSettings(area);
    }

    const settings = result.rows[0];
    
    switch (area) {
      case 'chat':
        return {
          provider: settings.chat_provider,
          model: settings.chat_model,
          temperature: parseFloat(settings.chat_temperature),
          maxTokens: settings.chat_max_tokens,
          relevancyScore: parseFloat(settings.chat_relevancy_score)
        };
      case 'search':
        return {
          provider: settings.search_provider,
          model: settings.search_model,
          temperature: parseFloat(settings.search_temperature),
          maxTokens: settings.search_max_tokens,
          relevancyScore: parseFloat(settings.search_relevancy_score)
        };
      case 'classification':
        return {
          provider: settings.classification_provider,
          model: settings.classification_model,
          temperature: parseFloat(settings.classification_temperature),
          maxTokens: settings.classification_max_tokens
        };
      case 'embedding':
        return {
          provider: settings.embedding_provider,
          model: settings.embedding_model
        };
      default:
        return getDefaultSettings(area);
    }
  } catch (error) {
    console.error('Error getting user settings:', error);
    return getDefaultSettings(area);
  }
}

/**
 * Get default settings when user settings don't exist
 */
function getDefaultSettings(area) {
  const defaults = {
    chat: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
      relevancyScore: 0.3
    },
    search: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1024,
      relevancyScore: 0.5
    },
    classification: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 512
    },
    embedding: {
      provider: 'openai',
      model: 'text-embedding-3-small'
    }
  };

  return defaults[area] || defaults.chat;
}

export async function generateEmbedding(text, userId = null) {
  try {
    // Get user settings if userId provided
    const settings = userId 
      ? await getUserSettings(userId, 'embedding')
      : getDefaultSettings('embedding');

    if (settings.provider === 'ollama') {
      return await ollamaService.generateOllamaEmbedding(text, settings.model);
    }

    // OpenAI (default)
    const response = await openai.embeddings.create({
      model: settings.model,
      input: text.slice(0, 8000),
      dimensions: 1536
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function classifyAndStructure(content, userId = null) {
  try {
    // Get user settings if userId provided
    const settings = userId
      ? await getUserSettings(userId, 'classification')
      : getDefaultSettings('classification');

    if (settings.provider === 'anthropic') {
      return await classifyWithAnthropic(content, settings);
    } else if (settings.provider === 'ollama') {
      return await classifyWithOllama(content, settings);
    }

    return await classifyWithOpenAI(content, settings);
  } catch (error) {
    console.error('Error classifying content:', error);
    throw error;
  }
}

async function classifyWithOpenAI(content, settings = {}) {
  const { model = 'gpt-4o', temperature = 0.3, maxTokens = 512 } = settings;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a content classification assistant for a personal knowledge management system called "Second Brain". 
        
Your task is to analyze the user's input and return a structured JSON object with:
- summary: A concise summary (string)
- category: One of [Idea, Task, Project, Reference, Journal, Meeting, Learning, Unsorted]
- tags: Array of relevant tags (3-5 tags)
- sentiment: One of [positive, neutral, negative]
- priority: One of [high, medium, low] (optional)
- entities: Array of named entities mentioned (optional)

Be helpful but concise. Return only valid JSON.`
      },
      {
        role: 'user',
        content: content
      }
    ],
    response_format: { type: "json_object" },
    temperature,
    max_tokens: maxTokens
  });

  return JSON.parse(response.choices[0].message.content);
}

async function classifyWithAnthropic(content, settings = {}) {
  const { model = 'claude-sonnet-4-20250514', temperature = 0.3, maxTokens = 512 } = settings;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      {
        role: 'user',
        content: `You are a content classification assistant for a personal knowledge management system called "Second Brain". 
        
Analyze the following content and return a JSON object with:
- summary: A brief 1-2 sentence summary
- category: One of [Idea, Task, Project, Reference, Journal, Meeting, Learning, Unsorted]
- tags: Array of 3-5 relevant tags
- sentiment: One of [positive, neutral, negative]
- priority: One of [high, medium, low] if applicable
- entities: Array of named entities, people, places, or organizations mentioned

Content to analyze:
"${content}"

Return only valid JSON, no additional text.`
      }
    ]
  });

  return JSON.parse(response.content[0].text);
}

async function classifyWithOllama(content, settings = {}) {
  const { model = 'llama3.2', temperature = 0.3, maxTokens = 512 } = settings;

  const response = await ollamaService.chatWithOllama(
    [
      {
        role: 'user',
        content: `Analyze this content and return JSON with: summary, category (Idea/Task/Project/Reference/Journal/Meeting/Learning/Unsorted), tags (3-5), sentiment (positive/neutral/negative), priority (high/medium/low), entities.

Content: "${content}"

Return only valid JSON.`
      }
    ],
    [],
    { model, temperature, max_tokens: maxTokens }
  );

  return JSON.parse(response.content);
}

export async function generateChatResponse(messages, context = [], userId = null) {
  try {
    // Get user settings if userId provided
    const settings = userId
      ? await getUserSettings(userId, 'chat')
      : getDefaultSettings('chat');

    if (settings.provider === 'anthropic') {
      return await chatWithAnthropic(messages, context, settings);
    } else if (settings.provider === 'ollama') {
      return await chatWithOllama(messages, context, settings);
    }

    return await chatWithOpenAI(messages, context, settings);
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

async function chatWithOpenAI(messages, context, settings = {}) {
  const { model = 'gpt-4o', temperature = 0.7, maxTokens = 2048 } = settings;

  const systemPrompt = `You are an AI assistant helping the user interact with their "Second Brain" - a personal knowledge management system.

${context.length > 0 ? `Here are some relevant memories from the user's Second Brain that you should use as context (with similarity scores):
${context.map(m => `- [Similarity: ${(m.similarity * 100).toFixed(0)}%] ${m.rawContent || m.raw_content} (Category: ${m.category}, Tags: ${m.tags?.join(', ') || 'none'})`).join('\n')}` : ''}

Your role is to:
1. Answer questions based on the context provided
2. Help the user find and organize their memories
3. Suggest connections between different pieces of information
4. Be concise and helpful

If you don't have enough context to answer a question or the similarity scores are below 40%, acknowledge that and ask for clarification or for them to reframe the question or give more context.`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];

  const response = await openai.chat.completions.create({
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens
  });

  return {
    content: response.choices[0].message.content,
    usage: response.usage,
    promptInfo: {
      provider: 'openai',
      model,
      temperature,
      maxTokens,
      contextCount: context.length,
      messages: fullMessages
    }
  };
}

async function chatWithAnthropic(messages, context, settings = {}) {
  const { model = 'claude-sonnet-4-20250514', temperature = 0.7, maxTokens = 2048 } = settings;

  const systemPrompt = `You are an AI assistant helping the user interact with their "Second Brain" - a personal knowledge management system.

${context.length > 0 ? `Here are some relevant memories from the user's Second Brain:
${context.map(m => `- ${m.rawContent || m.raw_content}`).join('\n')}` : ''}`;

  const anthropicMessages = [
    { role: 'user', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: anthropicMessages
  });

  return {
    content: response.content[0].text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens
    },
    promptInfo: {
      provider: 'anthropic',
      model,
      temperature,
      maxTokens,
      contextCount: context.length,
      systemPrompt,
      messages: anthropicMessages
    }
  };
}

async function chatWithOllama(messages, context, settings = {}) {
  const { model = 'llama3.2', temperature = 0.7, maxTokens = 2048 } = settings;

  const systemPrompt = `You are an AI assistant helping the user interact with their "Second Brain" - a personal knowledge management system.

${context.length > 0 ? `Here are some relevant memories from the user's Second Brain:
${context.map(m => `- ${m.rawContent || m.raw_content}`).join('\n')}` : ''}`;

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ];

  const response = await ollamaService.chatWithOllama(
    messages,
    context,
    { model, temperature, max_tokens: maxTokens }
  );

  return {
    content: response.content,
    usage: response.usage,
    promptInfo: {
      provider: 'ollama',
      model,
      temperature,
      maxTokens,
      contextCount: context.length,
      systemPrompt,
      messages: ollamaMessages
    }
  };
}