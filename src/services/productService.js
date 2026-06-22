import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
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

// ================= SORT MAP =================
const SORT_MAP = {
    'Featured':            { createdAt: -1 },
    'Price: Low to High':  { price: 1 },
    'Price: High to Low':  { price: -1 },
    'Top Rated':           { rating: -1 },   // virtual field added in aggregation
    'NameAZ':              { title: 1 },
    'NameZA':              { title: -1 },
};

// ================= GET ALL PRODUCTS (pagination) =================
export const getAllProducts = async (queryParams) => {
    const limit   = Math.min(parseInt(queryParams.limit, 10) || 12, 100);
    const cursor  = queryParams.cursor   || null;   // _id of last seen product
    const page    = parseInt(queryParams.page, 10) || null;
    const sortBy  = queryParams.sortBy   || 'Featured';
    const { category, search, maxPrice } = queryParams;

    // ── 1. Build base filter (excludes price cap — used for maxPrice calculation) ──
    const baseFilter = {};

    if (category && category.toLowerCase() !== 'all') {
        baseFilter.category = category.toLowerCase();
    }

    if (search) {
        baseFilter.title = { $regex: search, $options: 'i' };
    }

    // ── 2. Compute overall maxPrice from the base-filtered (un-capped) set ──
    const [priceAgg] = await Product.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, maxPrice: { $max: '$price' } } }
    ]);
    const computedMaxPrice = priceAgg ? Math.ceil(priceAgg.maxPrice) : 0;

    // ── 3. Determine sort criteria ──
    // "Top Rated" needs a virtual `rating` field from an aggregation —
    // handled separately below. All others use a direct .find() + .sort().
    const primarySort = SORT_MAP[sortBy] || { createdAt: -1 };
    const sortField = Object.keys(primarySort)[0];
    const sortDirection = primarySort[sortField];

    // ── 4. Build the paginated filter (includes price cap + cursor) ──
    const filter = { ...baseFilter };

    if (maxPrice) {
        filter.price = { $lte: parseFloat(maxPrice) };
    }

    // For cursor: apply range condition based on sort direction
    if (cursor) {
        if (sortDirection === -1) {
            filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
        } else {
            filter._id = { $gt: new mongoose.Types.ObjectId(cursor) };
        }
    }

    // For page/offset pagination
    let skipAmount = 0;
    if (page && page > 0) {
        skipAmount = (page - 1) * limit;
    }

    let products;

    if (sortBy === 'Top Rated') {
        // Use an aggregation pipeline to compute avgRating per product,
        // sort by it, and apply cursor/limit.
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    rating: {
                        $cond: {
                            if: { $gt: [{ $size: '$reviews' }, 0] },
                            then: { $avg: '$reviews.rating' },
                            else: 0
                        }
                    }
                }
            },
            { $sort: { rating: -1, _id: 1 } }
        ];

        if (skipAmount > 0) {
            pipeline.push({ $skip: skipAmount });
        }

        pipeline.push(
            { $limit: limit + 1 },          // fetch one extra to detect hasMore
            {
                $project: {
                    productId: 1,
                    title: 1,
                    price: 1,
                    category: 1,
                    description: 1,
                    images: { url: 1 },
                    rating: 1,
                    createdAt: 1
                }
            }
        );

        products = await Product.aggregate(pipeline);
    } else {
        // Standard path: find + sort + limit
        const query = Product.find(filter)
            .select('productId title price category description images createdAt')
            .sort({ ...primarySort, _id: 1 });  // _id as stable tiebreaker

        if (skipAmount > 0) {
            query.skip(skipAmount);
        }

        const rawProducts = await query.limit(limit + 1); // fetch one extra to detect hasMore

        // Attach avgRating from Review collection
        const productIds = rawProducts.map(p => p._id);

        const ratingAgg = await Review.aggregate([
            { $match: { product: { $in: productIds } } },
            { $group: { _id: '$product', avgRating: { $avg: '$rating' } } }
        ]);

        const ratingMap = {};
        for (const r of ratingAgg) {
            ratingMap[r._id.toString()] = parseFloat(r.avgRating.toFixed(1));
        }

        products = rawProducts.map(p => ({
            _id:         p._id,
            productId:   p.productId,
            title:       p.title,
            price:       p.price,
            category:    p.category,
            description: p.description,
            images:      p.images.map(img => ({ url: img.url })),
            rating:      ratingMap[p._id.toString()] ?? 0,
            createdAt:   p.createdAt
        }));
    }

    // ── 5. Determine hasMore & nextCursor ──
    const hasMore = products.length > limit;
    if (hasMore) products.pop();   // remove the extra probe document

    const nextCursor = hasMore ? products[products.length - 1]._id.toString() : null;

    return {
        products,
        nextCursor,
        hasMore,
        maxPrice: computedMaxPrice
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