import { Router } from 'express';
import { chatController } from '../controllers/chat.js';

const router = Router();

// Quick question (no session)
router.post('/quick', chatController.quickQuestion);

// Session management
router.post('/sessions', chatController.createSession);
router.get('/sessions', chatController.getUserSessions);
router.get('/sessions/:sessionId', chatController.getSessionHistory);
router.delete('/sessions/:sessionId', chatController.deleteSession);

// Send message in session
router.post('/sessions/:sessionId/messages', chatController.sendMessage);

export default router;
