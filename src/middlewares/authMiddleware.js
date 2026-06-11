import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { AppError } from './errorMiddleware.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return next(new AppError('User no longer exists', 401));
        }

        req.user = currentUser;
        next();

    } catch (err) {
        return next(new AppError('Invalid or expired token', 401));
    }
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};