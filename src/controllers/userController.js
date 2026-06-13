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

// ================= GET ALL USERS (Admin) =================
export const getAllUsers = asyncHandler(async (req, res) => {
    // 1. Query parameters se page, limit, search aur sort nikalen
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12; // Frontend ke mutabik 12 items
    const skip = (page - 1) * limit;

    const filter = {};

    // 2. Email search bar logic (Frontend search input ke liye)
    if (req.query.search) {
        filter.email = { $regex: req.query.search, $options: 'i' }; // Case-insensitive search
    }

    // 3. Dynamic Sorting logic (Frontend dropdown ke liye)
    let sortCriteria = { createdAt: -1 }; // Default: Latest to Oldest
    if (req.query.sort === 'oldest') {
        sortCriteria = { createdAt: 1 };  // Oldest to Latest
    }

    // 4. Parallel execution se data aur total count fetch karen
    const [users, totalUsers] = await Promise.all([
        User.find(filter)
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit)
            .select('-password'), // Security ke liye password field exclude kar di
        User.countDocuments(filter)
    ]);


    res.status(200).json({
        status: 'success',
        page,
        limit,
        totalCount: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
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