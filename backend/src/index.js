import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import memoryRoutes from './routes/memories.js';
import searchRoutes from './routes/search.js';
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import webhookRoutes from './routes/webhook.js';
import llmSettingsRoutes from './routes/llmSettings.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Allow localhost and local network (192.168.x.x)
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Also allow any 192.168.x.x address on port 5173
    if (origin.match(/^http:\/\/(localhost|192\.168\.\d+\.\d+|127\.0\.0\.1):5173$/)) {
      return callback(null, true);
    }
    
    // Check against explicit allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting - more lenient for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // More generous limit for development
  message: { error: 'Too many requests, please try again later.' }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Public routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/webhook', webhookRoutes);

// Protected routes with general rate limiting
app.use('/api/memories', apiLimiter, authMiddleware, memoryRoutes);
app.use('/api/search', apiLimiter, authMiddleware, searchRoutes);
app.use('/api/chat', apiLimiter, authMiddleware, chatRoutes);
app.use('/api/categories', apiLimiter, authMiddleware, categoryRoutes);
app.use('/api/llm-settings', apiLimiter, authMiddleware, llmSettingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Second Brain API server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth required for: /api/memories, /api/search, /api/chat, /api/categories`);
});

export default app;
