import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const makeAdmin = async () => {
  try {
    await connectDB();
    
    const email = process.argv[2];
    if (!email) {
      console.error('❌ Please provide an email: node scripts/makeAdmin.js admin@example.com');
      process.exit(1);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();
    
    console.log(`✅ ${email} is now an admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

makeAdmin();

