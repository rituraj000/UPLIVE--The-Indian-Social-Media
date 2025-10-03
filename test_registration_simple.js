const axios = require('axios');

async function testWithLogs() {
  try {
    console.log('🧪 Testing registration with detailed error handling...');
    
    const testData = {
      username: 'simpletest' + Date.now(),
      email: 'simple' + Date.now() + '@example.com',
      password: 'password123',
      fullName: 'Simple Test'
    };
    
    console.log('📝 Sending registration request for:', testData.email);
    
    const response = await axios.post('http://localhost:5000/api/auth/register', testData, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration SUCCESS:', response.data);
    
  } catch (error) {
    console.log('❌ Registration FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

testWithLogs();