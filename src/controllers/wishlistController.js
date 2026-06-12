import * as wishlistService from '../services/wishlistService.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET MY WISHLIST
export const getWishlist = asyncHandler(async (req, res) => {
    const wishlist = await wishlistService.getWishlist(req.user._id);

    res.status(200).json({
        status: 'success',
        results: wishlist.length,
        data: wishlist
    });
});

// ADD TO WISHLIST
export const addToWishlist = asyncHandler(async (req, res) => {
    const wishlist = await wishlistService.addToWishlist(req.user._id, req.params.productId);

    res.status(200).json({
        status: 'success',
        message: 'Product added to wishlist',
        data: wishlist
    });
});

// REMOVE FROM WISHLIST
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const wishlist = await wishlistService.removeFromWishlist(req.user._id, req.params.productId);

    res.status(200).json({
        status: 'success',
        message: 'Product removed from wishlist',
        data: wishlist
    });
});
