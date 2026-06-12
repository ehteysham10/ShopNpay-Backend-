import * as productService from '../services/productService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// CREATE PRODUCT (Admin)
export const createProduct = asyncHandler(async (req, res) => {
    const { title, description, price, category } = req.body;

    if (!title || !description || !price || !category) {
        throw new AppError('Title, description, price, and category are required', 400);
    }

    const product = await productService.createProduct(
        { title, description, price, category },
        req.files,
        req.user._id
    );

    res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: product
    });
});

// GET ALL PRODUCTS (Public)
export const getAllProducts = asyncHandler(async (req, res) => {
    const result = await productService.getAllProducts(req.query);

    res.status(200).json({
        status: 'success',
        results: result.products.length,
        data: result
    });
});

// GET SINGLE PRODUCT (Public)
export const getProduct = asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);

    res.status(200).json({
        status: 'success',
        data: product
    });
});

// UPDATE PRODUCT (Admin)
export const updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(
        req.params.productId,
        req.body,
        req.files
    );

    res.status(200).json({
        status: 'success',
        message: 'Product updated successfully',
        data: product
    });
});

// DELETE PRODUCT (Admin)
export const deleteProduct = asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.productId);

    res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully'
    });
});
