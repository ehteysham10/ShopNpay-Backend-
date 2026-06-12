import express from 'express';
import { getCart, addToCart, updateCartQuantity, removeFromCart } from '../controllers/cartController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All cart routes require authenticated user
router.use(protect, restrictTo('user'));

router.get('/', getCart);
router.post('/:productId', addToCart);
router.patch('/:productId', updateCartQuantity);
router.delete('/:productId', removeFromCart);

export default router;
