import express from 'express';
import { createReview, getProductReviews } from '../controllers/reviewController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getProductReviews)
    .post(protect, restrictTo('user'), createReview);

export default router;
