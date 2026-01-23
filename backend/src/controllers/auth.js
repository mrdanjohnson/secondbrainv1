import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export const authController = {
  // Register a new user
  register: asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters');
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email.toLowerCase(), passwordHash, name || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });
  }),

  // Login
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    // Find user
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });
  }),

  // Get current user profile
  me: asyncHandler(async (req, res) => {
    const userResult = await query(
      'SELECT id, email, name, preferences, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        createdAt: user.created_at
      }
    });
  }),

  // Update profile
  updateProfile: asyncHandler(async (req, res) => {
    const { name, preferences } = req.body;

    const result = await query(
      `UPDATE users 
       SET name = COALESCE($2, name),
           preferences = COALESCE($3, preferences),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, name, preferences`,
      [req.user.id, name, preferences ? JSON.stringify(preferences) : null]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences
      }
    });
  }),

  // Change password
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters');
    }

    // Get user with password
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!isValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1',
      [req.user.id, passwordHash]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  }),

  // Refresh token
  refreshToken: asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, 'Token is required');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      const newToken = generateToken(decoded.userId);

      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      throw new ApiError(401, 'Invalid token');
    }
  })
};

export default authController;
