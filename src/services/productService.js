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

// ================= GET ALL PRODUCTS (🚀 CLEAN & OPTIMIZED) =================
export const getAllProducts = async (queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 12;
    const { category, search, sort } = queryParams;

    const filter = {};

    if (category && category !== 'all') {
        filter.category = category.toLowerCase();
    }

    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    let sortCriteria = { createdAt: -1 };
    if (sort === 'oldest') {
        sortCriteria = { createdAt: 1 };
    }

    const skip = (page - 1) * limit;

    // Concurrently fetching and dropping heavy fields for landing speed
    const [products, total] = await Promise.all([
        Product.find(filter)
            .select('-description') // Exclude description only on listings/grids
            .sort(sortCriteria)
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
    // Keeping all fields intact so single product screen displays everything smoothly
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

    if (updateData.title) product.title = updateData.title;
    if (updateData.description) product.description = updateData.description;
    if (updateData.price) product.price = updateData.price;
    if (updateData.category) product.category = updateData.category;

    if (files && files.length > 0) {
        if (files.length > 5) {
            throw new AppError('Maximum 5 images allowed', 400);
        }

        const deletePromises = product.images.map(img =>
            deleteFromCloudinary(img.publicId)
        );
        await Promise.all(deletePromises);

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

    const deletePromises = product.images.map(img =>
        deleteFromCloudinary(img.publicId)
    );
    await Promise.all(deletePromises);

    await Product.deleteOne({ productId });
    return product;
};