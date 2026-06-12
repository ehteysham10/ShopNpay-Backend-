import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const PAKISTAN_CITIES = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan',
    'Sukkur', 'Sahiwal', 'Jhang', 'Sheikhupura', 'Larkana',
    'Gujrat', 'Rahim Yar Khan', 'Kasur', 'Dera Ghazi Khan',
    'Chiniot', 'Kamoke', 'Mirpur Khas', 'Nawabshah', 'Mingora',
    'Muzaffarabad', 'Jhelum', 'Okara', 'Sadiqabad', 'Jacobabad',
    'Kohat', 'Mansehra', 'Swabi', 'Attock', 'Chakwal', 'Taxila'
];

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: () => `ORD-${nanoid(8)}`
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        title: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    }],

    shippingInfo: {
        fullAddress: {
            type: String,
            required: [true, 'Full address is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            enum: {
                values: PAKISTAN_CITIES,
                message: 'Invalid city: {VALUE}'
            }
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        }
    },

    totalAmount: {
        type: Number,
        required: true
    },

    paymentIntentId: {
        type: String
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },

    orderStatus: {
        type: String,
        enum: ['processing', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    }

}, { timestamps: true });

orderSchema.index({ user: 1 });
orderSchema.index({ 'items.product': 1 });

// Export cities list for use in other files
export { PAKISTAN_CITIES };

const Order = mongoose.model('Order', orderSchema);
export default Order;
