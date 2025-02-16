
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const User = require('./models/User'); 

const createAdminUser = async () => {
const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Admin credentials are missing in the .env file.');
  return;
}

try {
  
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

  if (existingAdmin) {
    console.log('Admin user already exists.');
    return;
  }


  const adminUser = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    mobile: 231234568278,
    role: 'admin', 
    isVerified: true, 
  });


  console.log('Admin user created successfully.');
} catch (error) {
  console.error('Error creating admin user:', error);
}
};


module.exports = createAdminUser;
