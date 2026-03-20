require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { sendVerificationOTPEmail } = require('./src/services/emailService');

console.log('\n📝 ===== REGISTRATION EMAIL DEBUG TEST =====\n');

async function testRegistrationEmail() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Generate test email and OTP
    const testEmail = `test-debug-${Date.now()}@gmail.com`;
    const testOTP = String(Math.floor(1000 + Math.random() * 9000));
    
    console.log('📧 Test Details:');
    console.log('  Email:', testEmail);
    console.log('  OTP:', testOTP);
    console.log('  OTP Type:', typeof testOTP);
    console.log('');

    // Create a test user (but don't save to DB yet)
    console.log('👤 Creating test user object...');
    const testUser = {
      name: 'Debug Test User',
      email: testEmail,
      emailVerificationOTP: testOTP,
      emailVerificationOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
    };
    console.log('✅ Test user created\n');

    // Try sending email
    console.log('📤 Attempting to send OTP email...\n');
    const emailResult = await sendVerificationOTPEmail(testUser, testOTP);
    
    console.log('\n📊 Email Result:');
    console.log('  Success:', emailResult.success);
    console.log('  Message ID:', emailResult.messageId);
    if (emailResult.error) {
      console.log('  Error:', emailResult.error);
    }
    console.log('');

    if (emailResult.success) {
      console.log('🎉 ===== EMAIL SENT SUCCESSFULLY! =====');
      console.log('Check your email for the test message.\n');
    } else {
      console.log('❌ ===== EMAIL SEND FAILED =====');
      console.log('Error details:', emailResult.error);
      console.log('');
      console.log('Troubleshooting:');
      console.log('  1. Check if Gmail app password is correct');
      console.log('  2. Verify EMAIL_SERVICE is set to "gmail" in .env');
      console.log('  3. Check log output above for error details\n');
    }

  } catch (error) {
    console.error('\n💥 ===== FATAL ERROR =====');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================\n');
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed.\n');
    }
    process.exit(0);
  }
}

// Run test
testRegistrationEmail();
