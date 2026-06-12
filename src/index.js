import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { errorHandler, AppError } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// .env config
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log("MONGO_URI =", process.env.MONGO_URI);
console.log("JWT_SECRET =", process.env.JWT_SECRET);
const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'https://shopnpay.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, postman, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS Policy: Origin not allowed'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
// Body Parser Middleware
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("Error: MONGO_URI is still undefined! Check your .env file placement.");
    process.exit(1);
}

// Database Connection
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected Successfully to Atlas...'))
    .catch(err => console.error('Database Connection Error:', err));

// Test Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Auth APIs Mount point
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);

// Wildcard Error Route handler (Bina kisi fallback regex ke, safe execution)
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Middleware (Hamesha sab se aakhir mein hona chahiye)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});