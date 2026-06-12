import express from 'express';
import {
    createPaymentIntent,
    confirmOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    getCities
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public
router.get('/cities', getCities);

// User routes
router.post('/create-payment-intent', protect, restrictTo('user'), createPaymentIntent);
router.post('/confirm', protect, restrictTo('user'), confirmOrder);
router.get('/my-orders', protect, restrictTo('user'), getMyOrders);

// Admin routes
router.get('/', protect, restrictTo('admin'), getAllOrders);
router.patch('/:orderId/status', protect, restrictTo('admin'), updateOrderStatus);

export default router;
