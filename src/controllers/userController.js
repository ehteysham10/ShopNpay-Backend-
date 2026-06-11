import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import User from '../models/userModel.js';

export const getMe = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role, // Include role in response
            isVerified: user.isVerified,
            createdAt: user.createdAt
        }
    });
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
        throw new AppError('Invalid role. Allowed roles are "user" or "admin".', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
    );

    if (!updatedUser) {
        throw new AppError('No user found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        message: `User role updated to ${role} successfully`,
        data: {
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        }
    });
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find();

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
        throw new AppError('No user found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        message: 'User deleted successfully',
        data: null
    });
});