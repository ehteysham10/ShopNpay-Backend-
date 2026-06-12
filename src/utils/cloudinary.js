import { v2 as cloudinary } from 'cloudinary';

// Lazy config — runs on first use, after dotenv has loaded
let configured = false;
const ensureConfig = () => {
    if (!configured) {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        configured = true;
    }
};

// Upload buffer to Cloudinary
export const uploadToCloudinary = (buffer, folder = 'shopnpay/products') => {
    ensureConfig();
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// Delete image from Cloudinary by public_id
export const deleteFromCloudinary = async (publicId) => {
    ensureConfig();
    await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
