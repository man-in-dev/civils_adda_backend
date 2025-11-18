import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();
    
    const adminEmail = 'admin@civilsadda.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';

    // Check if admin user already exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      // Update existing user to be admin
      adminUser.isAdmin = true;
      adminUser.name = adminName;
      // Update password if needed
      if (adminPassword) {
        adminUser.password = adminPassword;
      }
      await adminUser.save();
      console.log('✅ Updated existing user to admin');
    } else {
      // Create new admin user
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        isAdmin: true,
      });
      console.log('✅ Created demo admin user');
    }
    
    console.log('\n📋 Admin Credentials:');
    console.log('   Email: admin@civilsadda.com');
    console.log('   Password: admin123');
    console.log('\n🔐 You can now login to the admin dashboard with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

