import * as productService from '../services/productService.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// ================= CREATE PRODUCT =================
export const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(
            req.body,
            req.files,
            req.user._id
        );

        res.status(201).json({
            success: true,
            product
        });

    } catch (err) {
        next(err);
    }
};

// ================= GET ALL PRODUCTS =================
export const getAllProducts = async (req, res, next) => {
    try {
        const result = await productService.getAllProducts(req.query);

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (err) {
        next(err);
    }
};

// ================= GET SINGLE PRODUCT =================
export const getProduct = async (req, res, next) => {
    try {
        const product = await productService.getProduct(req.params.productId);

        res.status(200).json({
            success: true,
            product
        });

    } catch (err) {
        next(err);
    }
};

// ================= UPDATE PRODUCT =================
export const updateProduct = async (req, res, next) => {
    try {
        const product = await productService.updateProduct(
            req.params.productId,
            req.body,
            req.files
        );

        res.status(200).json({
            success: true,
            product
        });

    } catch (err) {
        next(err);
    }
};

// ================= DELETE PRODUCT =================
export const deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProduct(req.params.productId);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (err) {
        next(err);
    }
};