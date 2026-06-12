import * as cartService from '../services/cartService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// GET MY CART
export const getCart = asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(req.user._id);

    res.status(200).json({
        status: 'success',
        results: cart.length,
        data: cart
    });
});

// ADD TO CART
export const addToCart = asyncHandler(async (req, res) => {
    const cart = await cartService.addToCart(req.user._id, req.params.productId);

    res.status(200).json({
        status: 'success',
        message: 'Product added to cart',
        data: cart
    });
});

// UPDATE QUANTITY
export const updateCartQuantity = asyncHandler(async (req, res) => {
    const { quantity } = req.body;

    if (!quantity) {
        throw new AppError('Quantity is required', 400);
    }

    const cart = await cartService.updateCartQuantity(
        req.user._id,
        req.params.productId,
        Number(quantity)
    );

    res.status(200).json({
        status: 'success',
        message: 'Cart updated',
        data: cart
    });
});

// REMOVE FROM CART
export const removeFromCart = asyncHandler(async (req, res) => {
    const cart = await cartService.removeFromCart(req.user._id, req.params.productId);

    res.status(200).json({
        status: 'success',
        message: 'Product removed from cart',
        data: cart
    });
});
