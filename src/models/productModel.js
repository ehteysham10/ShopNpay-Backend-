import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        unique: true,
        default: () => `SP-${nanoid(6)}`
    },

    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true,
        maxlength: [150, 'Title cannot exceed 150 characters']
    },

    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        validate: {
            validator: function (val) {
                const wordCount = val.split(/\s+/).filter(Boolean).length;
                return wordCount <= 600;
            },
            message: 'Description cannot exceed 600 words'
        }
    },

    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },

    images: {
        type: [{
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        }],
        validate: {
            validator: function (val) {
                return val.length <= 5;
            },
            message: 'A product can have at most 5 images'
        }
    },

    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: {
            values: ['shoes', 'watch', 'phone', 'headphones', 'laptops', 'cameras', 'gaming', 'accessories', 'clothing'],
            message: 'Invalid category: {VALUE}'
        },
        lowercase: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

}, { timestamps: true });

// Index for faster lookups
productSchema.index({ category: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
