const axios = require("axios");

async function testRegistration() {
  try {
    console.log("🧪 Testing registration endpoint...");

    const testUser = {
      username: "testuser" + Date.now(),
      email: "test" + Date.now() + "@example.com",
      password: "testpassword123",
      fullName: "Test User",
    };

    console.log("Attempting registration with:", {
      username: testUser.username,
      email: testUser.email,
      fullName: testUser.fullName,
    });

    const response = await axios.post(
      "http://localhost:5000/api/auth/register",
      testUser,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Registration successful:", response.data);
  } catch (error) {
    if (error.response) {
      console.log("❌ Registration failed with status:", error.response.status);
      console.log("Response data:", error.response.data);
      console.log("Response headers:", error.response.headers);
    } else {
      console.log("❌ Network error:", error.message);
    }
  }
}

testRegistration();
