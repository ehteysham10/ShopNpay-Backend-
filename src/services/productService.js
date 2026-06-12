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

// ================= GET ALL PRODUCTS =================
export const getAllProducts = async (queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 12;
    const { category, search } = queryParams;

    const filter = {};

    if (category && category !== 'all') {
        filter.category = category.toLowerCase();
    }

    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'name'),
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
