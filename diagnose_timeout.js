// Comprehensive timeout diagnostic test
const https = require('https');

// Test with proper timeout handling and timing
const testWithTimeout = (path, data = null, testName = "Test") => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'uplive-the-indian-social-media.onrender.com',
      port: 443,
      path: path,
      method: data ? 'POST' : 'GET',
      headers: {
        'Origin': 'https://uplive-the-indian-social-media.vercel.app',
        'Content-Type': 'application/json',
        'User-Agent': 'UPLIVE-Debug-Client/1.0'
      },
      timeout: 35000 // 35 second timeout
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`\n🧪 ${testName} - ${options.method} ${path}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);

    const req = https.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      console.log(`📈 Response received after: ${responseTime}ms`);
      console.log(`📊 Status: ${res.statusCode}`);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const totalTime = Date.now() - startTime;
        console.log(`✅ ${testName} completed in: ${totalTime}ms`);
        
        resolve({
          status: res.statusCode,
          data: responseData,
          time: totalTime,
          headers: res.headers
        });
      });
    });

    req.on('timeout', () => {
      const timeoutTime = Date.now() - startTime;
      console.log(`⏰ ${testName} TIMEOUT after: ${timeoutTime}ms`);
      req.abort();
      reject(new Error(`Timeout after ${timeoutTime}ms`));
    });

    req.on('error', (error) => {
      const errorTime = Date.now() - startTime;
      console.log(`❌ ${testName} ERROR after: ${errorTime}ms - ${error.message}`);
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

// Run comprehensive tests
async function runDiagnostics() {
  console.log('🔍 UPLIVE PRODUCTION TIMEOUT DIAGNOSTICS');
  console.log('=========================================');
  
  try {
    // Test 1: Basic health check (should be fast)
    console.log('\n📋 TEST 1: Health Check (Baseline)');
    const health = await testWithTimeout('/api/health', null, 'Health Check');
    console.log(`Result: ${health.status} in ${health.time}ms`);
    
    // Test 2: Simple registration with minimal data
    console.log('\n📋 TEST 2: Registration with Missing Fields');
    const simpleReg = await testWithTimeout('/api/auth/register', {
      phoneNumber: '+919876543210'
    }, 'Simple Registration');
    console.log(`Result: ${simpleReg.status} in ${simpleReg.time}ms`);
    console.log(`Response: ${simpleReg.data.substring(0, 200)}...`);
    
    // Test 3: Complete registration data
    console.log('\n📋 TEST 3: Complete Registration Data');
    const completeReg = await testWithTimeout('/api/auth/register', {
      phoneNumber: '+919876543210',
      password: 'testpass123',
      countryCode: '+91',
      username: 'testuser123',
      fullName: 'Test User'
    }, 'Complete Registration');
    console.log(`Result: ${completeReg.status} in ${completeReg.time}ms`);
    console.log(`Response: ${completeReg.data.substring(0, 300)}...`);
    
    // Test 4: Alternative endpoints
    console.log('\n📋 TEST 4: Alternative Endpoints');
    try {
      const status = await testWithTimeout('/api/status', null, 'Status Check');
      console.log(`Status endpoint: ${status.status} in ${status.time}ms`);
    } catch (e) {
      console.log(`Status endpoint failed: ${e.message}`);
    }
    
  } catch (error) {
    console.error(`\n❌ Diagnostic failed: ${error.message}`);
  }
  
  console.log('\n🏁 DIAGNOSTICS COMPLETE');
  console.log('\n💡 ANALYSIS:');
  console.log('- If health check is fast but registration is slow, issue is in registration logic');
  console.log('- If all endpoints are slow, issue is with server/database connection');
  console.log('- If timeouts occur, server might be hanging on SMS/database operations');
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Check Render logs for hanging processes');
  console.log('2. Verify database connection timeout');
  console.log('3. Check SMS service initialization');
  console.log('4. Consider using debug endpoints for detailed logging');
}

runDiagnostics().catch(console.error);