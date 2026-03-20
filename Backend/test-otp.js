const axios = require('axios');

async function testOTP() {
  try {
    console.log('Testing OTP verification for irfanchaudhry355@gmail.com...');

    // First try with a test OTP to see the error
    const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
      email: 'irfanchaudhry355@gmail.com',
      otp: '1234'
    });

    console.log('✅ OTP verification successful!');
    console.log('Response:', response.data);

  } catch (err) {
    console.log('❌ OTP verification failed:');
    console.log('Status:', err.response?.status);
    console.log('Error:', err.response?.data?.error);
  }
}

testOTP();