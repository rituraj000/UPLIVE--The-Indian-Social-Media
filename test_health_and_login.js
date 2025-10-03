const axios = require("axios");

async function testHealth() {
  try {
    console.log("🏥 Testing server health...");
    const response = await axios.get("http://localhost:5000/api/health", {
      timeout: 5000,
    });
    console.log("✅ Server is healthy:", response.data);

    // Now test login endpoint with a simple request
    console.log("🧪 Testing login endpoint response time...");
    const start = Date.now();
    try {
      const loginResponse = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: "test@example.com",
          password: "testpassword123",
        },
        {
          timeout: 10000,
        }
      );
      const end = Date.now();
      console.log(
        `✅ Login endpoint responded in ${end - start}ms`,
        loginResponse.data
      );
    } catch (loginError) {
      const end = Date.now();
      console.log(
        `⚠️  Login endpoint responded in ${end - start}ms with error:`,
        loginError.response ? loginError.response.status : loginError.message
      );
      if (loginError.response) {
        console.log("Response data:", loginError.response.data);
      }
    }
  } catch (error) {
    console.log("❌ Server health check failed:", error.message);
  }
}

testHealth();
