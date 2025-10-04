const axios = require("axios");

// Test the frontend proxy setup
async function testFrontendProxy() {
  console.log("Testing frontend proxy to backend...");

  try {
    // Test 1: Direct backend call
    console.log("\n1. Testing direct backend call...");
    const directResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "test@example.com",
        password: "testpassword",
      }
    );
    console.log("✅ Direct backend call successful:", directResponse.status);

    // Test 2: Through frontend proxy
    console.log("\n2. Testing through frontend proxy...");
    const proxyResponse = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        email: "test@example.com",
        password: "testpassword",
      }
    );
    console.log("✅ Proxy call successful:", proxyResponse.status);
  } catch (error) {
    console.log(
      "❌ Error:",
      error.response?.status,
      error.response?.data || error.message
    );
    console.log("Request URL:", error.config?.url);
    console.log("Request data:", error.config?.data);
  }
}

testFrontendProxy();
