import { query } from '../db/index.js';
import * as vectorService from '../services/vectorService.js';
import { generateChatResponse, classifyAndStructure, getUserSettings } from '../services/aiService.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { smartSearch } from '../services/smartSearch.js';

export const chatController = {
  // Send a message and get AI response with context
  sendMessage: asyncHandler(async (req, res) => {
    const { message, sessionId, contextLimit = 5, specificMemoryIds } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string') {
      throw new ApiError(400, 'Message is required');
    }

    // Check if user wants to save the conversation as a memory
    const saveConversationRegex = /remember\s+(this\s+)?(conversation|chat|discussion)/i;
    const shouldSaveConversation = saveConversationRegex.test(message);

    // Create or use existing session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = uuidv4();
    }

    // If user wants to save conversation, do it before processing the message
    let savedMemoryId = null;
    if (shouldSaveConversation) {
      // Get full conversation history
      const fullHistoryResult = await query(
        `SELECT role, content, created_at 
         FROM chat_messages 
         WHERE session_id = $1 
         ORDER BY created_at ASC`,
        [currentSessionId]
      );

      if (fullHistoryResult.rows.length > 0) {
        // Format conversation as a transcript
        const transcript = fullHistoryResult.rows.map(msg => {
          const role = msg.role === 'user' ? 'User' : 'AI';
          return `${role}: ${msg.content}`;
        }).join('\n\n');

        const conversationSummary = `AI Chat Conversation\n\n${transcript}`;

        // Generate embedding
        const embedding = await generateEmbedding(conversationSummary, userId);

        // Classify the conversation
        let structuredData;
        try {
          structuredData = await classifyAndStructure(conversationSummary, userId);
          // Add 'ai chat' tag
          structuredData.tags = [...new Set([...structuredData.tags, 'ai chat', 'conversation'])];
        } catch (error) {
          console.warn('AI classification failed for conversation, using defaults:', error.message);
          structuredData = {
            summary: `Conversation with ${fullHistoryResult.rows.length} messages`,
            category: 'Journal',
            tags: ['ai chat', 'conversation'],
            sentiment: 'neutral'
          };
        }

        // Save as memory
        const memoryData = {
          raw_content: conversationSummary,
          structured_content: structuredData,
          category: structuredData.category,
          tags: structuredData.tags,
          embedding,
          source: 'ai_chat'
        };

        const savedMemory = await vectorService.createMemory(memoryData);
        savedMemoryId = savedMemory.id;
        console.log('[CHAT] Saved conversation as memory:', savedMemoryId);

        // Save user message
        await query(
          `INSERT INTO chat_messages (session_id, role, content, memory_context)
           VALUES ($1, 'user', $2, $3::jsonb)`,
          [currentSessionId, message, JSON.stringify([])]
        );

        // Create a friendly canned response
        const cannedResponse = `I've saved our conversation to your memories! 📝\n\nThis chat has been:\n• Categorized as: ${structuredData.category}\n• Tagged with: ${structuredData.tags.join(', ')}\n\nYou can find it anytime in your Memories tab and I'll be able to reference it in future conversations.`;

        // Save canned response
        await query(
          `INSERT INTO chat_messages (session_id, role, content, memory_context)
           VALUES ($1, 'assistant', $2, $3::jsonb)`,
          [currentSessionId, cannedResponse, JSON.stringify([])]
        );

        // Return early with canned response
        return res.json({
          success: true,
          data: {
            sessionId: currentSessionId,
            message,
            response: cannedResponse,
            contextMemories: [],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            savedAsMemory: {
              id: savedMemoryId,
              message: 'Conversation saved to your memories!'
            }
          }
        });
      } else {
        // No conversation to save yet
        const noHistoryResponse = "I don't see any conversation history to save yet. Let's chat a bit first, and then you can ask me to remember it! 💬";
        
        await query(
          `INSERT INTO chat_messages (session_id, role, content, memory_context)
           VALUES ($1, 'user', $2, $3::jsonb)`,
          [currentSessionId, message, JSON.stringify([])]
        );

        await query(
          `INSERT INTO chat_messages (session_id, role, content, memory_context)
           VALUES ($1, 'assistant', $2, $3::jsonb)`,
          [currentSessionId, noHistoryResponse, JSON.stringify([])]
        );

        return res.json({
          success: true,
          data: {
            sessionId: currentSessionId,
            message,
            response: noHistoryResponse,
            contextMemories: [],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            savedAsMemory: null
          }
        });
      }
    }

    // Get relevant memories for context
    let contextMemories;
    if (specificMemoryIds && Array.isArray(specificMemoryIds) && specificMemoryIds.length > 0) {
      // User selected specific memories
      console.log('[CHAT] Using specific memories:', specificMemoryIds);
      const memoriesResult = await query(
        `SELECT id, raw_content, category, tags 
         FROM memories 
         WHERE id = ANY($1::uuid[])`,
        [specificMemoryIds]
      );
      contextMemories = memoriesResult.rows.map(row => ({
        id: row.id,
        rawContent: row.raw_content,
        category: row.category,
        tags: row.tags,
        similarity: 1.0 // Manual selection = 100% relevant
      }));
    } else {
      // Auto-search for relevant memories using smart search
      const chatSettings = await getUserSettings(userId, 'chat');
      const threshold = chatSettings.relevancyScore || 0.3;
      
      console.log('[CHAT] Using smart search for context with:', { message, contextLimit, threshold });
      
      const searchResult = await smartSearch(message, {
        limit: parseInt(contextLimit),
        userId,
        threshold
      });
      
      contextMemories = searchResult.results;
      
      // If no memories found and no date filter was active, get at least 1 result
      if (contextMemories.length === 0 && !searchResult.metadata.dateFiltered) {
        console.log('[CHAT] No memories met threshold, fetching with threshold=0');
        const fallbackSearch = await smartSearch(message, {
          limit: 1,
          userId,
          threshold: 0
        });
        contextMemories = fallbackSearch.results;
      }
    }
    console.log('[CHAT] Found', contextMemories.length, 'context memories');

    // Get conversation history
    const historyResult = await query(
      `SELECT role, content 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC 
       LIMIT 20`,
      [currentSessionId]
    );

    const history = historyResult.rows.map(row => ({
      role: row.role,
      content: row.content
    }));

    // Build messages for AI
    const messages = [
      ...history,
      { role: 'user', content: message }
    ];

    // Generate AI response with context
    const response = await generateChatResponse(messages, contextMemories, userId);

    // Save user message
    await query(
      `INSERT INTO chat_messages (session_id, role, content, memory_context)
       VALUES ($1, 'user', $2, $3::jsonb)`,
      [currentSessionId, message, JSON.stringify(contextMemories)]
    );

    // Save assistant response
    await query(
      `INSERT INTO chat_messages (session_id, role, content, memory_context)
       VALUES ($1, 'assistant', $2, $3::jsonb)`,
      [currentSessionId, response.content, JSON.stringify(contextMemories)]
    );

    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        message,
        response: response.content,
        contextMemories: contextMemories.map(m => ({
          id: m.id,
          rawContent: m.rawContent,
          category: m.category,
          similarity: m.similarity
        })),
        usage: response.usage,
        promptInfo: response.promptInfo,
        savedAsMemory: savedMemoryId ? {
          id: savedMemoryId,
          message: 'Conversation saved to your memories!'
        } : null
      }
    });
  }),

  // Get chat history for a session
  getSessionHistory: asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const messagesResult = await query(
      `SELECT id, role, content, memory_context, created_at
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC 
       LIMIT $2`,
      [sessionId, parseInt(limit)]
    );

    res.json({
      success: true,
      data: {
        sessionId,
        messages: messagesResult.rows.map(row => ({
          id: row.id,
          role: row.role,
          content: row.content,
          context: row.memory_context,
          createdAt: row.created_at
        }))
      }
    });
  }),

  // Get all sessions for user
  getUserSessions: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const sessionsResult = await query(
      `SELECT s.*, 
              (SELECT content FROM chat_messages 
               WHERE session_id = s.id AND role = 'user'
               ORDER BY created_at ASC 
               LIMIT 1) as first_user_message,
              (SELECT COUNT(*) FROM chat_messages 
               WHERE session_id = s.id) as message_count
       FROM chat_sessions s
       WHERE s.user_id = $1
       ORDER BY s.updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: sessionsResult.rows.map(row => ({
        id: row.id,
        title: row.title || null,
        firstUserMessage: row.first_user_message,
        messageCount: parseInt(row.message_count),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  }),

  // Create a new session
  createSession: asyncHandler(async (req, res) => {
    const { title } = req.body;
    const userId = req.user.id;

    const result = await query(
      `INSERT INTO chat_sessions (user_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, title || null]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        createdAt: result.rows[0].created_at
      }
    });
  }),

  // Delete a session
  deleteSession: asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `DELETE FROM chat_sessions 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Session not found');
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  }),

  // Quick question (no session, single exchange)
  quickQuestion: asyncHandler(async (req, res) => {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      throw new ApiError(400, 'Question is required');
    }

    // Get relevant memories
    const contextMemories = await vectorService.searchMemoriesByText(question, {
      limit: 3,
      threshold: 0.2
    });

    const response = await generateChatResponse(
      [{ role: 'user', content: question }],
      contextMemories,
      userId
    );

    res.json({
      success: true,
      data: {
        question,
        response: response.content,
        contextUsed: contextMemories.length,
        memories: contextMemories.map(m => ({
          id: m.id,
          rawContent: m.rawContent.slice(0, 100),
          similarity: m.similarity
        }))
      }
    });
  })
};

export default chatController;
