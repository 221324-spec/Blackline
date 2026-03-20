const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testRegistration() {
  try {
    console.log('\n📝 ===== TESTING REGISTRATION WITH EMAIL =====\n');
    
    const email = `testuser-${Date.now()}@gmail.com`;
    const password = 'Test123!@#';
    const name = 'Test User';
    
    console.log('📋 Registration Details:');
    console.log('  Name:', name);
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('');

    console.log('🔄 Sending registration request to backend...');
    const response = await axios.post(`${API_BASE}/api/auth/register`, {
      name,
      email,
      password,
      role: 'trader'
    });

    console.log('✅ Registration response received!');
    console.log('Status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success || response.data.message) {
     console.log('\n🎉 Registration successful!');
      console.log('📧 Check your email for the OTP');
      console.log('Email:', email);
    }

  } catch (error) {
    console.error('\n❌ Registration failed!');
    console.error('Error Status:', error.response?.status);
    console.error('Error Message:', error.response?.data?.error || error.message);
    console.error('Full Error Response:');
    console.error(JSON.stringify(error.response?.data, null, 2));
  }
  
  process.exit(0);
}

testRegistration();
