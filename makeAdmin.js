import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './src/models/userModel.js';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email. Example: node makeAdmin.js user@example.com');
    process.exit(1);
}

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB...');
        
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { role: 'admin' },
            { new: true }
        );

        if (!user) {
            console.error(`❌ User with email "${email}" not found.`);
        } else {
            console.log(`✅ Success! User "${user.name}" (${user.email}) is now an ADMIN.`);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Database Connection Error:', err);
        process.exit(1);
    });
