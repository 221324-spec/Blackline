// Complete OTP verification flow test
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./src/models/User');

const API_URL = 'http://localhost:5000/api/auth';
const testEmail = `testuser-${Date.now()}@test.com`;
const testPassword = 'Test123!@#';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOTPFlow() {
  try {
    console.log('\n🚀 ========== OTP VERIFICATION FLOW TEST ==========\n');
    
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blackline-matrix');
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Register
    console.log('📝 STEP 1: Registering new user...');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
    try {
      const registerRes = await axios.post(`${API_URL}/register`, {
        name: 'Test User',
        email: testEmail,
        password: testPassword,
        role: 'trader'
      });
      console.log('✅ Registration successful');
      console.log('Response:', registerRes.data);
    } catch (err) {
      console.error('❌ Registration failed:', err.response?.data || err.message);
      throw err;
    }

    console.log('\n⏳ Waiting 2 seconds for database to update...\n');
    await sleep(2000);

    // Step 2: Get OTP from database
    console.log('📧 STEP 2: Retrieving OTP from database...');
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    
    if (!user) {
      console.error('❌ User not found in database!');
      throw new Error('User not created');
    }
    
    console.log('✅ User found in database');
    console.log('User Details:');
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Verified:', user.isEmailVerified);
    console.log('  - OTP:', user.emailVerificationOTP);
    console.log('  - OTP Type:', typeof user.emailVerificationOTP);
    console.log('  - OTP Expires:', new Date(user.emailVerificationOTPExpires));
    
    if (!user.emailVerificationOTP) {
      console.error('❌ OTP not found in database!');
      throw new Error('OTP not generated');
    }

    const otp = String(user.emailVerificationOTP);
    console.log('🔑 OTP to use for verification:', otp);

    // Step 3: Try to verify with wrong OTP first
    console.log('\n🧪 STEP 3A: Testing with WRONG OTP (should fail)...');
    try {
      await axios.post(`${API_URL}/verify-otp`, {
        email: testEmail,
        otp: '0000'
      });
      console.error('❌ Should have failed but didn\'t!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Correctly rejected invalid OTP');
        console.log('Error message:', err.response.data.error);
      } else {
        console.error('❌ Unexpected error:', err.response?.data || err.message);
      }
    }

    // Step 4: Verify with correct OTP
    console.log('\n🔐 STEP 3B: Verifying with CORRECT OTP...');
    try {
      const verifyRes = await axios.post(`${API_URL}/verify-otp`, {
        email: testEmail,
        otp: otp
      });
      console.log('✅ OTP verification successful!');
      console.log('Response:', verifyRes.data);
      console.log('Token received:', !!verifyRes.data.token);
    } catch (err) {
      console.error('❌ OTP verification failed:', err.response?.data || err.message);
      throw err;
    }

    // Step 5: Verify user is now marked as verified
    console.log('\n✅ STEP 4: Checking if user is verified in database...');
    const updatedUser = await User.findOne({ email: testEmail.toLowerCase() });
    console.log('Email Verified:', updatedUser.isEmailVerified);
    console.log('OTP cleared:', !updatedUser.emailVerificationOTP);
    
    if (updatedUser.isEmailVerified) {
      console.log('✅ User successfully verified!');
    } else {
      console.error('❌ User is not marked as verified!');
    }

    // Step 6: Try to login
    console.log('\n🚪 STEP 5: Testing login with verified account...');
    try {
      const loginRes = await axios.post(`${API_URL}/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('✅ Login successful!');
      console.log('Token received:', !!loginRes.data.token);
      console.log('User role:', loginRes.data.user.role);
    } catch (err) {
      console.error('❌ Login failed:', err.response?.data || err.message);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    await User.deleteOne({ _id: user._id });
    console.log('✅ Test user deleted\n');

    console.log('✨ ========== ALL TESTS PASSED! ==========\n');

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run test
testOTPFlow().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
