import { Router } from 'express';
import { authController } from '../controllers/auth.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', authController.me);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);

export default router;
