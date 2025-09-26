const axios = require("axios");

async function testFeedAPI() {
  console.log("🔍 Testing Feed API...");

  try {
    // Test if server is running
    const response = await axios.get("http://localhost:5000/api/posts/all", {
      headers: {
        Authorization: "Bearer YOUR_TOKEN_HERE", // Replace with actual token
      },
    });

    console.log("✅ API Response:", {
      status: response.status,
      dataType: typeof response.data,
      postCount: Array.isArray(response.data)
        ? response.data.length
        : "Not array",
      firstPost: response.data[0] || "No posts",
    });
  } catch (error) {
    console.error("❌ API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

testFeedAPI();
