import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// ================= GET WISHLIST =================
export const getWishlist = async (userId) => {
    const user = await User.findById(userId).populate('wishlist');

    // Filter out any deleted products
    const validWishlist = user.wishlist.filter(item => item !== null);

    return validWishlist;
};

// ================= ADD TO WISHLIST =================
export const addToWishlist = async (userId, productId) => {
    const product = await Product.findOne({ productId });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const user = await User.findById(userId);

    // Check if already in wishlist
    const exists = user.wishlist.some(
        id => id.toString() === product._id.toString()
    );

    if (exists) {
        throw new AppError('Product is already in your wishlist', 400);
    }

    user.wishlist.push(product._id);
    await user.save({ validateBeforeSave: false });

    await user.populate('wishlist');

    return user.wishlist;
};

// ================= REMOVE FROM WISHLIST =================
export const removeFromWishlist = async (userId, productId) => {
    const product = await Product.findOne({ productId });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const user = await User.findById(userId);

    const itemIndex = user.wishlist.findIndex(
        id => id.toString() === product._id.toString()
    );

    if (itemIndex === -1) {
        throw new AppError('Product is not in your wishlist', 404);
    }

    user.wishlist.splice(itemIndex, 1);
    await user.save({ validateBeforeSave: false });

    await user.populate('wishlist');

    return user.wishlist;
};
