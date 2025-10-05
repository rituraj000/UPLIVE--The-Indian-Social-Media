const jwt = require("jsonwebtoken");
const axios = require("axios");

async function testWalletWithAuth() {
  try {
    console.log("Testing wallet API with authentication...");

    // Create a test JWT token
    const testUser = {
      id: "507f1f77bcf86cd799439011", // Test MongoDB ObjectId
      username: "testuser",
      email: "test@example.com",
    };

    const token = jwt.sign(testUser, "instagram_clone_jwt_secret_key_2024", {
      expiresIn: "1h",
    });
    console.log("✅ Generated test token");

    // Test wallet endpoint with auth
    try {
      const walletResponse = await axios.get(
        "http://localhost:5000/api/wallet",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Wallet endpoint success:", walletResponse.data);
    } catch (walletError) {
      console.log(
        "❌ Wallet endpoint error:",
        walletError.response?.status,
        walletError.response?.data
      );
      if (walletError.response?.status === 500) {
        console.log("Server error details:", walletError.response?.data);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testWalletWithAuth();
