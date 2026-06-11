import express from 'express';
import { getMe, updateUserRole, getAllUsers, deleteUser } from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET logged-in user profile
router.get('/me', protect, getMe);

// PATCH update user role (restricted to Admins)
router.patch('/:id/role', protect, restrictTo('admin'), updateUserRole);

// GET all users (restricted to Admins)
router.get('/', protect, restrictTo('admin'), getAllUsers);

// DELETE user by ID (restricted to Admins)
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

export default router;