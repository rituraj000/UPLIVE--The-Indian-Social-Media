const axios = require("axios");

async function testWalletAPI() {
  try {
    console.log("Testing wallet API endpoint...");

    // Test if server is running
    const response = await axios.get("http://localhost:5000/api/health");
    console.log("✅ Server is running:", response.data.message);

    // Test wallet endpoint (this will likely fail due to auth, but we can see the error)
    try {
      const walletResponse = await axios.get(
        "http://localhost:5000/api/wallet"
      );
      console.log("✅ Wallet endpoint response:", walletResponse.data);
    } catch (walletError) {
      console.log(
        "❌ Wallet endpoint error:",
        walletError.response?.status,
        walletError.response?.data
      );
    }
  } catch (error) {
    console.error("❌ Server test failed:", error.message);
    console.log("Make sure the backend server is running on port 5000");
  }
}

testWalletAPI();
