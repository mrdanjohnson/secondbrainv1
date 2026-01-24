import { query } from '../db/index.js';
import * as vectorService from '../services/vectorService.js';
import { generateChatResponse, generateEmbedding } from '../services/aiService.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export const chatController = {
  // Send a message and get AI response with context
  sendMessage: asyncHandler(async (req, res) => {
    const { message, sessionId, contextLimit = 5, specificMemoryIds } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string') {
      throw new ApiError(400, 'Message is required');
    }

    // Create or use existing session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = uuidv4();
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
      // Auto-search for relevant memories
      console.log('[CHAT] Searching for context with:', { message, contextLimit, threshold: 0.3 });
      contextMemories = await vectorService.searchMemoriesByText(message, {
        limit: parseInt(contextLimit),
        threshold: 0.3
      });
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
    const response = await generateChatResponse(messages, contextMemories);

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
        usage: response.usage
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
      contextMemories
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
