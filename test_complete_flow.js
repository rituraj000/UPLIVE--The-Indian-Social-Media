const axios = require('axios');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete registration and login flow...');
    
    const testData = {
      username: 'testuser' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      password: 'testpassword123',
      fullName: 'Test User'
    };
    
    console.log('📝 Testing registration...');
    const regResponse = await axios.post('http://localhost:5000/api/auth/register', testData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful:', regResponse.data);
    
    // Now test login
    console.log('🔐 Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: testData.email,
      password: testData.password
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful:', {
      token: loginResponse.data.token ? 'Present' : 'Missing',
      user: loginResponse.data.user ? loginResponse.data.user.username : 'No user data'
    });
    
    console.log('🎉 Complete flow test successful!');
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed with status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testCompleteFlow();
