

import express from 'express';
import { register, login, verifyEmail, googleLogin, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);

// 🔥 GOOGLE ROUTE
router.post('/google', googleLogin);

// 🔑 PASSWORD RESET
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

export default router;