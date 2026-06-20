


import Stripe from 'stripe';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// Lazy init (same dotenv issue as Cloudinary)
let stripe;
const getStripe = () => {
    if (!stripe) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
};

// ================= CREATE PAYMENT INTENT =================
// Reads from user's cart, calculates total server-side
export const createPaymentIntent = async (userId, shippingInfo) => {
    const { fullAddress, city, phone } = shippingInfo;

    if (!fullAddress || !city || !phone) {
        throw new AppError('Full address, city, and phone number are required', 400);
    }

    // Get user's cart with populated products
    const user = await User.findById(userId).populate('cart.product');

    if (!user.cart || user.cart.length === 0) {
        throw new AppError('Your cart is empty', 400);
    }

    // Filter out any deleted products
    const validCart = user.cart.filter(item => item.product !== null);

    if (validCart.length === 0) {
        throw new AppError('Your cart contains no valid products', 400);
    }

    // Build items array with prices from DB (never trust frontend)
    const items = validCart.map(item => ({
        product: item.product._id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity
    }));

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create Stripe Payment Intent (amount in cents)
    const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'usd',
        metadata: {
            userId: userId.toString()
        }
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        items,
        totalAmount
    };
};

// ================= CONFIRM ORDER =================
// After frontend confirms payment with Stripe
export const confirmOrder = async (userId, paymentIntentId, shippingInfo) => {
    const { fullAddress, city, phone } = shippingInfo;

    // 1. Verify payment with Stripe
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
        throw new AppError('Payment has not been completed', 400);
    }

    // 🔥 CRITICAL FIX 1: Duplicate check sab se upar. 
    // Agar exact same request do dafa aaye, to purana order return ho jaye bina error throw kiye.
    const existingOrder = await Order.findOne({ paymentIntentId });
    if (existingOrder) {
        return existingOrder;
    }

    // Get user's cart with products
    const user = await User.findById(userId).populate('cart.product');

    // Filter out any deleted products safely
    const validCart = user.cart ? user.cart.filter(item => item.product !== null) : [];

    // 🔥 CRITICAL FIX 2: Race condition handler logic corrected.
    // Agar cart khali hai YA valid products nahi hain, to error throw karne se pehle 
    // double check karein ke kahin pehli request ne order successfully create to nahi kar diya tha.
    if (validCart.length === 0) {
        const raceConditionCheck = await Order.findOne({ paymentIntentId });
        if (raceConditionCheck) {
            return raceConditionCheck;
        }
        throw new AppError('Your cart is empty or contains invalid products', 400);
    }

    // Build items with price from DB
    const items = validCart.map(item => ({
        product: item.product._id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity
    }));

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const order = await Order.create({
        user: userId,
        items,
        shippingInfo: { fullAddress, city, phone },
        totalAmount,
        paymentIntentId,
        paymentStatus: 'paid',
        orderStatus: 'processing'
    });

    // Clear user's cart after successful order
    user.cart = [];
    await user.save({ validateBeforeSave: false });

    return order;
};

// ================= GET MY ORDERS =================
export const getMyOrders = async (userId) => {
    const orders = await Order.find({ user: userId })
        .populate('items.product', 'productId title images')
        .sort({ createdAt: -1 });

    return orders;
};


// ================= GET ALL ORDERS (Admin) =================
export const getAllOrders = async (queryParams) => {
    // 1. Base 10 ke sath parse karein aur default limit 12 rakhein
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 12;
    const skip = (page - 1) * limit;

    // 2. Frontend dropdown ke mutabik dynamic sorting set karein
    let sortCriteria = { createdAt: -1 }; // Default: Latest to Oldest
    if (queryParams.sort === 'oldest') {
        sortCriteria = { createdAt: 1 };  // Oldest to Latest
    }

    // 3. Parallel Execution (Best Practice)
    const [orders, total] = await Promise.all([
        Order.find()
            .populate('user', 'name email')
            .populate('items.product', 'productId title images')
            .sort(sortCriteria) // Dynamic sort pass kiya
            .skip(skip)
            .limit(limit),
        Order.countDocuments()
    ]);

    return {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

// ================= UPDATE ORDER STATUS (Admin) =================
export const updateOrderStatus = async (orderId, status) => {
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // 🔥 FIXED BUG: Order.findOne({ orderId }) ko Order.findById(orderId) kiya hai 
    // taaki Mongoose default unique hex ID (_id) se document perfectly find kar sake.
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    order.orderStatus = status;
    await order.save();

    return order;
};

// ================= GET CITIES LIST =================
export { PAKISTAN_CITIES } from '../models/orderModel.js';