const axios = require("axios");

async function testLogin() {
  try {
    console.log("🧪 Testing login endpoint...");

    const response = await axios.post(
      "http://localhost:5000/auth/login",
      {
        email: "test@example.com", // Replace with your test email
        password: "testpassword123", // Replace with your test password
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Login successful:", response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.log("❌ Request timed out - server is not responding");
    } else if (error.response) {
      console.log("❌ Login failed with status:", error.response.status);
      console.log("Response:", error.response.data);
    } else {
      console.log("❌ Network error:", error.message);
    }
  }
}

// Test basic server health first
async function testServerHealth() {
  try {
    console.log("🏥 Testing server health...");
    const response = await axios.get("http://localhost:5000/health", {
      timeout: 5000,
    });
    console.log("✅ Server is healthy:", response.data);
    return true;
  } catch (error) {
    console.log("❌ Server health check failed:", error.message);
    return false;
  }
}

async function main() {
  const isHealthy = await testServerHealth();
  if (isHealthy) {
    await testLogin();
  } else {
    console.log("❌ Server is not healthy, skipping login test");
  }
}

main();
