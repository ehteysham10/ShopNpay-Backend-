import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// ================= GET CART =================
export const getCart = async (userId) => {
    const user = await User.findById(userId).populate('cart.product');

    // Filter out any deleted products
    const validCart = user.cart.filter(item => item.product !== null);

    return validCart;
};

// ================= ADD TO CART =================
export const addToCart = async (userId, productId) => {
    const product = await Product.findOne({ productId });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const user = await User.findById(userId);

    // Check if product already in cart
    const existingItem = user.cart.find(
        item => item.product.toString() === product._id.toString()
    );

    if (existingItem) {
        throw new AppError('Product is already in your cart', 400);
    }

    user.cart.push({ product: product._id, quantity: 1 });
    await user.save({ validateBeforeSave: false });

    // Return populated cart
    await user.populate('cart.product');

    return user.cart;
};

// ================= UPDATE CART QUANTITY =================
export const updateCartQuantity = async (userId, productId, quantity) => {
    const product = await Product.findOne({ productId });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (quantity < 1) {
        throw new AppError('Quantity must be at least 1', 400);
    }

    if (quantity > 5) {
        throw new AppError('You can purchase a maximum of 5 units of this product', 400);
    }

    const user = await User.findById(userId);

    const cartItem = user.cart.find(
        item => item.product.toString() === product._id.toString()
    );

    if (!cartItem) {
        throw new AppError('Product is not in your cart', 404);
    }

    cartItem.quantity = quantity;
    await user.save({ validateBeforeSave: false });

    await user.populate('cart.product');

    return user.cart;
};

// ================= REMOVE FROM CART =================
export const removeFromCart = async (userId, productId) => {
    const product = await Product.findOne({ productId });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const user = await User.findById(userId);

    const itemIndex = user.cart.findIndex(
        item => item.product.toString() === product._id.toString()
    );

    if (itemIndex === -1) {
        throw new AppError('Product is not in your cart', 404);
    }

    user.cart.splice(itemIndex, 1);
    await user.save({ validateBeforeSave: false });

    await user.populate('cart.product');

    return user.cart;
};
