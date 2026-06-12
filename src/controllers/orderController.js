import * as orderService from '../services/orderService.js';
import { PAKISTAN_CITIES } from '../models/orderModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// CREATE PAYMENT INTENT (User)
export const createPaymentIntent = asyncHandler(async (req, res) => {
    const { fullAddress, city, phone } = req.body;

    if (!fullAddress || !city || !phone) {
        throw new AppError('Full address, city, and phone number are required', 400);
    }

    const result = await orderService.createPaymentIntent(req.user._id, {
        fullAddress,
        city,
        phone
    });

    res.status(200).json({
        status: 'success',
        message: 'Payment intent created',
        data: result
    });
});

// CONFIRM ORDER (User)
export const confirmOrder = asyncHandler(async (req, res) => {
    const { paymentIntentId, fullAddress, city, phone } = req.body;

    if (!paymentIntentId) {
        throw new AppError('Payment intent ID is required', 400);
    }

    if (!fullAddress || !city || !phone) {
        throw new AppError('Shipping info is required', 400);
    }

    const order = await orderService.confirmOrder(req.user._id, paymentIntentId, {
        fullAddress,
        city,
        phone
    });

    res.status(201).json({
        status: 'success',
        message: 'Your order has been placed! It is on the way 🎉',
        data: order
    });
});

// GET MY ORDERS (User)
export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getMyOrders(req.user._id);

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: orders
    });
});

// GET ALL ORDERS (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
    const result = await orderService.getAllOrders(req.query);

    res.status(200).json({
        status: 'success',
        results: result.orders.length,
        data: result
    });
});

// UPDATE ORDER STATUS (Admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        throw new AppError('Status is required', 400);
    }

    const order = await orderService.updateOrderStatus(req.params.orderId, status);

    res.status(200).json({
        status: 'success',
        message: `Order status updated to ${status}`,
        data: order
    });
});

// GET CITIES LIST (Public)
export const getCities = asyncHandler(async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: PAKISTAN_CITIES
    });
});
