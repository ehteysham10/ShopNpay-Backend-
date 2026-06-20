
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../middlewares/errorMiddleware.js';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// ================= GOOGLE LOGIN =================
export const googleAuth = async (credential) => {
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    // CASE 1: NEW USER
    if (!user) {
        user = await User.create({
            name,
            email,
            googleId: sub,
            avatar: picture,
            authProvider: 'google',
            role: 'user',
            isVerified: true
        });
    }

    // CASE 2: EXISTING LOCAL USER → LINK GOOGLE
    if (user && !user.googleId) {
        user.googleId = sub;
        user.avatar = picture;
        user.authProvider = 'google';
        user.isVerified = true;
        await user.save({ validateBeforeSave: false });
    }

    const token = signToken(user._id);
    user.password = undefined;

    return { token, user };
};

// ================= REGISTER =================
export const registerUser = async (userData) => {
    const { name, email, password } = userData;

    if (!password) {
        throw new AppError('Password is required for registration', 400);
    }

    let user = await User.findOne({ email });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

    if (user && !user.isVerified) {
        user.verificationToken = token;
        user.verificationTokenExpires = tokenExpiry;
        await user.save({ validateBeforeSave: false });

        await sendVerificationEmail(user, token);

        return { user, message: "Verification email sent again." };
    }

    if (user && user.isVerified) {
        throw new AppError('Email already registered and verified', 400);
    }

    user = await User.create({
        name,
        email,
        password,
        role: 'user',
        verificationToken: token,
        verificationTokenExpires: tokenExpiry
    });

    await sendVerificationEmail(user, token);

    user.password = undefined;

    return { user, message: "Registration successful." };
};

// ================= VERIFY =================
export const verifyEmailToken = async (token) => {
    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) throw new AppError('Token invalid or expired', 400);

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return user;
};

// ================= LOGIN =================
export const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password || !(await user.correctPassword(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    if (!user.isVerified) {
        const token = crypto.randomBytes(32).toString('hex');

        user.verificationToken = token;
        user.verificationTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        await sendVerificationEmail(user, token);

        throw new AppError('Account not verified. Email sent again.', 401);
    }

    const token = signToken(user._id);
    user.password = undefined;

    return { token, user };
};

// ================= EMAIL =================
const sendVerificationEmail = async (user, token) => {
    const url = `${process.env.BASE_URL}/api/v1/auth/verify-email/${token}`;

    const html = `
    <div style="font-family:Arial;background:#f4f4f4;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:10px;">
            <h2>Welcome ${user.name}</h2>
            <p>Verify your account:</p>
            <a href="${url}" style="padding:12px 18px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">
                Verify Email
            </a>
        </div>
    </div>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Verify your account',
        message: url,
        html
    });
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (email) => {
    const user = await User.findOne({ email });

    // Always return success to prevent user enumeration
    if (!user) return;

    // Block Google-only users (no password to reset)
    if (user.authProvider === 'google' && !user.password) {
        throw new AppError('This account uses Google login. Password reset is not available.', 400);
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing in DB
    user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token expires in 10 minutes
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Build reset URL (points to frontend)
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetURL = `${frontendURL}/reset-password/${resetToken}`;

    const html = `
    <div style="font-family:Arial;background:#f4f4f4;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:10px;">
            <h2 style="color:#333;">Reset Your Password</h2>
            <p>Hello <b>${user.name}</b>,</p>
            <p>You requested a password reset. Click the button below to set a new password:</p>
            <a href="${resetURL}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
                Reset Password
            </a>
            <p style="margin-top:20px;color:#888;font-size:12px;">
                This link will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
        </div>
    </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Reset your ShopnPay password',
            message: `Reset your password here: ${resetURL}`,
            html
        });
    } catch (err) {
        // If email fails, clear the token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw new AppError('Failed to send reset email. Try again later.', 500);
    }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (token, newPassword) => {
    // Hash the incoming token to match what's stored in DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError('Token is invalid or has expired', 400);
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return user;
};