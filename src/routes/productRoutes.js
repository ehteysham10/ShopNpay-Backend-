import express from 'express';
import { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';
import reviewRouter from './reviewRoutes.js';

const router = express.Router();

// Mount review router as a nested route
router.use('/:productId/reviews', reviewRouter);

// Public routes
router.get('/', getAllProducts);
router.get('/:productId', getProduct);

// Admin-only routes
router.post('/', protect, restrictTo('admin'), upload.array('images', 5), createProduct);
router.patch('/:productId', protect, restrictTo('admin'), upload.array('images', 5), updateProduct);
router.delete('/:productId', protect, restrictTo('admin'), deleteProduct);

export default router;
