const axios = require('axios');

async function testRegistration() {
    try {
        console.log('Testing registration endpoint...');
        
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            username: 'testuser123',
            email: 'test@example.com',
            password: 'testpass123',
            fullName: 'Test User'
        });
        
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

testRegistration();