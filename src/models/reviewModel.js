import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Review must belong to a product']
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },

    name: {
        type: String,
        required: [true, 'Reviewer name is required']
    },

    rating: {
        type: Number,
        required: [true, 'Please provide a rating between 1 and 5'],
        min: [1, 'Rating must be at least 1 star'],
        max: [5, 'Rating cannot exceed 5 stars']
    },

    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
        validate: {
            validator: function (val) {
                const wordCount = val.split(/\s+/).filter(Boolean).length;
                return wordCount <= 350;
            },
            message: 'Comment cannot exceed 350 words'
        }
    }

}, { timestamps: true });

// Prevent a user from leaving multiple reviews on the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
