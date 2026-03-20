const mongoose = require('mongoose');
const User = require('./src/models/User');

async function getOTP() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blackline-matrix');
    const user = await User.findOne({ email: 'irfanchaudhry355@gmail.com' });
    if (user) {
      console.log('User found:', user.email);
      console.log('OTP:', user.emailVerificationOTP);
      console.log('OTP Expires:', user.emailVerificationOTPExpires);
      console.log('Email Verified:', user.isEmailVerified);
      console.log('Current time:', new Date());
      console.log('OTP expired?', user.emailVerificationOTPExpires < Date.now());
    } else {
      console.log('User not found');
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getOTP();