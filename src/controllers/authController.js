

// import * as authService from '../services/authService.js';
// import asyncHandler from '../utils/asyncHandler.js';
// import { AppError } from '../middlewares/errorMiddleware.js';

// const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// export const register = asyncHandler(async (req, res) => {
//     const { name, email, password, confirmPassword } = req.body;

//     if (!name || !email || !password || !confirmPassword) {
//         throw new AppError('All fields are required', 400);
//     }

//     if (password !== confirmPassword) {
//         throw new AppError('Passwords do not match', 400);
//     }

//     if (!passwordRegex.test(password)) {
//         throw new AppError('Weak password', 400);
//     }

//     const result = await authService.registerUser({
//         name,
//         email,
//         password
//     });

//     res.status(201).json({
//         status: 'success',
//         message: result.message,
//         data: result.user
//     });
// });

// export const verifyEmail = asyncHandler(async (req, res) => {
//     const { token } = req.params;

//     await authService.verifyEmailToken(token);

//     res.status(200).json({
//         status: 'success',
//         message: 'Email verified successfully'
//     });
// });

// export const login = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         throw new AppError('Email & password required', 400);
//     }

//     const result = await authService.loginUser(email, password);

//     res.status(200).json({
//         status: 'success',
//         message: 'Login successful',
//         data: result
//     });
// }); 













import * as authService from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// GOOGLE LOGIN
export const googleLogin = asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        throw new AppError('Google credential required', 400);
    }

    const result = await authService.googleAuth(credential);

    res.status(200).json({
        status: 'success',
        message: 'Google login successful',
        data: result
    });
});

// existing functions unchanged
export const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
    }

    const result = await authService.registerUser(req.body);

    res.status(201).json({
        status: 'success',
        message: result.message,
        data: result.user
    });
});

export const verifyEmail = asyncHandler(async (req, res) => {
    await authService.verifyEmailToken(req.params.token);

    res.status(200).json({
        status: 'success',
        message: 'Email verified'
    });
});

export const login = asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body.email, req.body.password);

    res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
    });
});

// FORGOT PASSWORD
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('Email is required', 400);
    }

    await authService.forgotPassword(email);

    // Always return success (prevents user enumeration)
    res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent.'
    });
});

// RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (!password || !confirmPassword) {
        throw new AppError('Password and confirm password are required', 400);
    }

    if (password !== confirmPassword) {
        throw new AppError('Passwords do not match', 400);
    }

    if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
    }

    await authService.resetPassword(token, password);

    res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully. You can now login with your new password.'
    });
});