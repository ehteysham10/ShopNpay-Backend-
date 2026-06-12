import Review from '../models/reviewModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// ================= CREATE REVIEW =================
export const createReview = async (productId, userId, userName, rating, comment) => {
    // 1. Find product by short productId
    const product = await Product.findOne({ productId });
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // 2. Check if user has already reviewed this product
    const existingReview = await Review.findOne({
        product: product._id,
        user: userId
    });
    if (existingReview) {
        throw new AppError('You have already reviewed this product', 400);
    }

    // 3. Verify if user has purchased the product
    const order = await Order.findOne({
        user: userId,
        paymentStatus: 'paid',
        'items.product': product._id
    });

    if (!order) {
        throw new AppError('You can only review products you have purchased', 403);
    }

    // 4. Create review
    const review = await Review.create({
        product: product._id,
        user: userId,
        name: userName,
        rating,
        comment
    });

    return review;
};

// ================= GET PRODUCT REVIEWS =================
export const getProductReviews = async (productId) => {
    const product = await Product.findOne({ productId });
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const reviews = await Review.find({ product: product._id })
        .sort({ createdAt: -1 });

    return reviews;
};
