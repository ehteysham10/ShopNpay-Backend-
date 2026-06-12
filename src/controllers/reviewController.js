import * as reviewService from '../services/reviewService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// CREATE REVIEW (User who purchased)
export const createReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!rating || !comment) {
        throw new AppError('Rating and comment are required', 400);
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new AppError('Rating must be a number between 1 and 5', 400);
    }

    const review = await reviewService.createReview(
        productId,
        req.user._id,
        req.user.name,
        ratingNum,
        comment
    );

    res.status(201).json({
        status: 'success',
        message: 'Review submitted successfully',
        data: review
    });
});

// GET PRODUCT REVIEWS (Public)
export const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const reviews = await reviewService.getProductReviews(productId);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: reviews
    });
});
