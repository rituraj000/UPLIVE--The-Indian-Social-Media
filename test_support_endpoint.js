const axios = require("axios");

// Test the support endpoint
async function testSupportEndpoint() {
  try {
    console.log("Testing support endpoint...");

    // You'll need to replace this with a real JWT token from your app
    const token = "YOUR_JWT_TOKEN_HERE";

    const response = await axios.post(
      "http://localhost:5000/api/wallet/support",
      {
        recipientId: "507f1f77bcf86cd799439011", // Sample ObjectId
        amount: 10,
        message: "Test support",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Success:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testSupportEndpoint();
