import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

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

export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit input length
      dimensions: 1536
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function classifyAndStructure(content) {
  try {
    const provider = process.env.AI_PROVIDER || 'openai';

    if (provider === 'anthropic') {
      return await classifyWithAnthropic(content);
    }

    return await classifyWithOpenAI(content);
  } catch (error) {
    console.error('Error classifying content:', error);
    throw error;
  }
}

async function classifyWithOpenAI(content) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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
    temperature: 0.3
  });

  return JSON.parse(response.choices[0].message.content);
}

async function classifyWithAnthropic(content) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
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

export async function generateChatResponse(messages, context = []) {
  try {
    const provider = process.env.AI_PROVIDER || 'openai';

    if (provider === 'anthropic') {
      return await chatWithAnthropic(messages, context);
    }

    return await chatWithOpenAI(messages, context);
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

async function chatWithOpenAI(messages, context) {
  const systemPrompt = `You are an AI assistant helping the user interact with their "Second Brain" - a personal knowledge management system.

${context.length > 0 ? `Here are some relevant memories from the user's Second Brain that you should use as context:
${context.map(m => `- ${m.rawContent || m.raw_content} (Category: ${m.category}, Tags: ${m.tags?.join(', ') || 'none'})`).join('\n')}` : ''}

Your role is to:
1. Answer questions based on the context provided
2. Help the user find and organize their memories
3. Suggest connections between different pieces of information
4. Be concise and helpful

If you don't have enough context to answer a question, acknowledge that and ask for clarification.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ],
    temperature: 0.7,
    max_tokens: 2048
  });

  return {
    content: response.choices[0].message.content,
    usage: response.usage
  };
}

async function chatWithAnthropic(messages, context) {
  const systemPrompt = `You are an AI assistant helping the user interact with their "Second Brain" - a personal knowledge management system.

${context.length > 0 ? `Here are some relevant memories from the user's Second Brain:
${context.map(m => `- ${m.rawContent || m.raw_content}`).join('\n')}` : ''}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      { role: 'user', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ]
  });

  return {
    content: response.content[0].text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens
    }
  };
}

export default {
  generateEmbedding,
  classifyAndStructure,
  generateChatResponse
};
