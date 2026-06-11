// import User from '../models/userModel.js';
// import jwt from 'jsonwebtoken';
// import crypto from 'crypto';
// import { AppError } from '../middlewares/errorMiddleware.js';
// import sendEmail from '../utils/sendEmail.js';

// const signToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_EXPIRES_IN || '1d'
//     });
// };

// // ================= REGISTER =================
// export const registerUser = async (userData) => {
//     const { name, email, password } = userData;

//     let user = await User.findOne({ email });

//     const token = crypto.randomBytes(32).toString('hex');
//     const tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

//     // user exists but NOT verified → resend email
//     if (user && !user.isVerified) {
//         user.verificationToken = token;
//         user.verificationTokenExpires = tokenExpiry;
//         await user.save({ validateBeforeSave: false });

//         await sendVerificationEmail(user, token);

//         return {
//             user,
//             message: "Verification email sent again. Please verify your account."
//         };
//     }

//     // user already verified
//     if (user && user.isVerified) {
//         throw new AppError('Email already registered and verified', 400);
//     }

//     // new user
//     user = await User.create({
//         name,
//         email,
//         password,
//         verificationToken: token,
//         verificationTokenExpires: tokenExpiry
//     });

//     await sendVerificationEmail(user, token);

//     user.password = undefined;

//     return {
//         user,
//         message: "Registration successful. Please verify your email."
//     };
// };

// // ================= VERIFY EMAIL =================
// export const verifyEmailToken = async (token) => {
//     const user = await User.findOne({
//         verificationToken: token,
//         verificationTokenExpires: { $gt: Date.now() }
//     });

//     if (!user) {
//         throw new AppError('Token expired or invalid', 400);
//     }

//     user.isVerified = true;
//     user.verificationToken = undefined;
//     user.verificationTokenExpires = undefined;

//     await user.save({ validateBeforeSave: false });

//     return user;
// };

// // ================= LOGIN (UPDATED) =================
// export const loginUser = async (email, password) => {
//     const user = await User.findOne({ email }).select('+password');

//     if (!user || !(await user.correctPassword(password, user.password))) {
//         throw new AppError('Incorrect email or password', 401);
//     }

//     // 🔴 UNVERIFIED ACCOUNT HANDLING
//     if (!user.isVerified) {
//         const token = crypto.randomBytes(32).toString('hex');

//         user.verificationToken = token;
//         user.verificationTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

//         await user.save({ validateBeforeSave: false });

//         await sendVerificationEmail(user, token);

//         throw new AppError(
//             'Your account is not verified. Verification email sent again. Please verify first.',
//             401
//         );
//     }

//     const token = signToken(user._id);
//     user.password = undefined;

//     return { token, user };
// };

// // ================= EMAIL FUNCTION =================
// const sendVerificationEmail = async (user, token) => {
//     const verificationURL = `${process.env.BASE_URL}/api/v1/auth/verify-email/${token}`;

//     const html = `
//     <div style="font-family: Arial; background:#f6f6f6; padding:20px;">
//         <div style="max-width:600px; margin:auto; background:#fff; padding:25px; border-radius:10px;">

//             <h2 style="color:#333;">Verify Your Account</h2>

//             <p>Hello <b>${user.name}</b>,</p>

//             <p>Please verify your account to continue using ShopnPay.</p>

//             <a href="${verificationURL}" 
//                style="display:inline-block;padding:12px 18px;background:#4f46e5;
//                       color:#fff;text-decoration:none;border-radius:6px;">
//                 Verify Email
//             </a>

//             <p style="margin-top:20px;color:#888;font-size:12px;">
//                 This link will expire in 7 days.
//             </p>
//         </div>
//     </div>
//     `;

//     await sendEmail({
//         email: user.email,
//         subject: 'Verify your ShopnPay account',
//         message: `Verify here: ${verificationURL}`,
//         html
//     });
// };


// import { OAuth2Client } from 'google-auth-library';

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // ================= GOOGLE LOGIN =================
// export const googleLogin = async (credential) => {
//     const ticket = await client.verifyIdToken({
//         idToken: credential,
//         audience: process.env.GOOGLE_CLIENT_ID
//     });

//     const payload = ticket.getPayload();

//     const { email, name, picture, sub } = payload;

//     if (!email) {
//         throw new AppError('Google authentication failed', 400);
//     }

//     let user = await User.findOne({ email });

//     // CASE 1: new user → create
//     if (!user) {
//         user = await User.create({
//             name,
//             email,
//             googleId: sub,
//             avatar: picture,
//             authProvider: 'google',
//             isVerified: true
//         });
//     }

//     // CASE 2: existing local user → link google
//     if (user && !user.googleId) {
//         user.googleId = sub;
//         user.avatar = picture;
//         user.authProvider = 'google';
//         user.isVerified = true;
//         await user.save({ validateBeforeSave: false });
//     }

//     const token = signToken(user._id);
//     user.password = undefined;

//     return { token, user };
// }; 











import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../middlewares/errorMiddleware.js';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
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