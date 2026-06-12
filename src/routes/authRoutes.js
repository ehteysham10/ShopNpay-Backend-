// import express from 'express';
// import { register, login, verifyEmail } from '../controllers/authController.js';

// const router = express.Router();

// router.post('/register', register);
// router.get('/verify-email/:token', verifyEmail); // GET request for link click
// router.post('/login', login);

// export default router;










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