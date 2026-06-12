// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: [true, 'Name is required'],
//         trim: true
//     },
//     email: {
//         type: String,
//         required: [true, 'Email is required'],
//         unique: true,
//         lowercase: true,
//         trim: true
//     },
//     password: {
//         type: String,
//         required: [true, 'Password is required'],
//         select: false
//     },
//     isVerified: {
//         type: Boolean,
//         default: false
//     },
//     verificationToken: String,
//     verificationTokenExpires: Date
// }, { timestamps: true });

// // Hash password before saving
// userSchema.pre('save', async function () {
//     if (!this.isModified('password')) return;
//     this.password = await bcrypt.hash(this.password, 12);
// });

// // Compare passwordsS
// userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
//     return await bcrypt.compare(candidatePassword, userPassword);
// };

// const User = mongoose.model('User', userSchema);
// export default User;  




import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },

    // optional now (important for Google users)
    password: {
        type: String,
        select: false
    },

    googleId: {
        type: String
    },

    avatar: {
        type: String
    },

    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verificationToken: String,
    verificationTokenExpires: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1,
            max: 5
        }
    }],

    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]

}, { timestamps: true });

// Hash password only if exists
userSchema.pre('save', async function () {
    if (!this.password) return;
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare passwords
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    if (!userPassword) return false;
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
export default User;