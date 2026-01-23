import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token in the Authorization header' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-me');
    
    // Optional: Verify user exists in database
    const userResult = await query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found' 
      });
    }
    
    // Attach user to request
    req.user = {
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      name: userResult.rows[0].name
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token verification failed' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please refresh your token' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-me');
      
      const userResult = await query(
        'SELECT id, email, name FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (userResult.rows.length > 0) {
        req.user = {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          name: userResult.rows[0].name
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
