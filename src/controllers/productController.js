// import * as productService from '../services/productService.js';
// import asyncHandler from '../utils/asyncHandler.js';
// import { AppError } from '../middlewares/errorMiddleware.js';

// // CREATE PRODUCT (Admin)
// export const createProduct = asyncHandler(async (req, res) => {
//     const { title, description, price, category } = req.body;

//     if (!title || !description || !price || !category) {
//         throw new AppError('Title, description, price, and category are required', 400);
//     }

//     const product = await productService.createProduct(
//         { title, description, price, category },
//         req.files,
//         req.user._id
//     );

//     res.status(201).json({
//         status: 'success',
//         message: 'Product created successfully',
//         data: product
//     });
// });

// // GET ALL PRODUCTS (Public)
// export const getAllProducts = asyncHandler(async (req, res) => {
//     const result = await productService.getAllProducts(req.query);

//     res.status(200).json({
//         status: 'success',
//         results: result.products.length,
//         data: result
//     });
// });

// // GET SINGLE PRODUCT (Public)
// export const getProduct = asyncHandler(async (req, res) => {
//     const product = await productService.getProduct(req.params.productId);

//     res.status(200).json({
//         status: 'success',
//         data: product
//     });
// });

// // UPDATE PRODUCT (Admin)
// export const updateProduct = asyncHandler(async (req, res) => {
//     const product = await productService.updateProduct(
//         req.params.productId,
//         req.body,
//         req.files
//     );

//     res.status(200).json({
//         status: 'success',
//         message: 'Product updated successfully',
//         data: product
//     });
// });

// // DELETE PRODUCT (Admin)
// export const deleteProduct = asyncHandler(async (req, res) => {
//     await productService.deleteProduct(req.params.productId);

//     res.status(200).json({
//         status: 'success',
//         message: 'Product deleted successfully'
//     });
// }); 















import Product from '../models/productModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// ================= CREATE PRODUCT =================
export const createProduct = async (productData, files, adminId) => {
    const { title, description, price, category } = productData;

    if (!files || files.length === 0) {
        throw new AppError('At least one product image is required', 400);
    }

    if (files.length > 5) {
        throw new AppError('Maximum 5 images allowed', 400);
    }

    // Upload all images to Cloudinary
    const imageUploadPromises = files.map(file =>
        uploadToCloudinary(file.buffer, 'shopnpay/products')
    );

    const uploadResults = await Promise.all(imageUploadPromises);

    const images = uploadResults.map(result => ({
        url: result.secure_url,
        publicId: result.public_id
    }));

    const product = await Product.create({
        title,
        description,
        price,
        category,
        images,
        createdBy: adminId
    });

    return product;
};

// ================= GET ALL PRODUCTS (💥 OPTIMIZED) =================
export const getAllProducts = async (queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 12;
    const { category, search, sort } = queryParams;

    const filter = {};

    // 1. Category Filter Logic
    if (category && category !== 'all') {
        filter.category = category.toLowerCase();
    }

    // 2. Search Text Title Filter Logic
    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    // 3. Dynamic Sorting Handler
    let sortCriteria = { createdAt: -1 }; // Default: Newest first
    if (sort === 'oldest') {
        sortCriteria = { createdAt: 1 };
    }

    const skip = (page - 1) * limit;

    // 4. Concurrently fetch data with payload management
    // 🔥 Added .select() to exclude description & createdBy for blazing fast response on grids
    const [products, total] = await Promise.all([
        Product.find(filter)
            .select('-description -createdBy')
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit),
        Product.countDocuments(filter)
    ]);

    return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// ================= GET SINGLE PRODUCT =================
export const getProduct = async (productId) => {
    const product = await Product.findOne({ productId }).populate('createdBy', 'name');

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    return product;
};

// ================= UPDATE PRODUCT =================
export const updateProduct = async (productId, updateData, files) => {
    const product = await Product.findOne({ productId });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Update text fields
    if (updateData.title) product.title = updateData.title;
    if (updateData.description) product.description = updateData.description;
    if (updateData.price) product.price = updateData.price;
    if (updateData.category) product.category = updateData.category;

    // If new images are uploaded, replace old ones
    if (files && files.length > 0) {
        if (files.length > 5) {
            throw new AppError('Maximum 5 images allowed', 400);
        }

        // Delete old images from Cloudinary
        const deletePromises = product.images.map(img =>
            deleteFromCloudinary(img.publicId)
        );
        await Promise.all(deletePromises);

        // Upload new images
        const uploadPromises = files.map(file =>
            uploadToCloudinary(file.buffer, 'shopnpay/products')
        );
        const uploadResults = await Promise.all(uploadPromises);

        product.images = uploadResults.map(result => ({
            url: result.secure_url,
            publicId: result.public_id
        }));
    }

    await product.save();

    return product;
};

// ================= DELETE PRODUCT =================
export const deleteProduct = async (productId) => {
    const product = await Product.findOne({ productId });

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Delete images from Cloudinary
    const deletePromises = product.images.map(img =>
        deleteFromCloudinary(img.publicId)
    );
    await Promise.all(deletePromises);

    await Product.deleteOne({ productId });

    return product;
};
