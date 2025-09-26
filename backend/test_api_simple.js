const axios = require("axios");

async function testAPI() {
  console.log("Testing Posts API endpoint...");

  try {
    const response = await axios.get("http://localhost:5000/api/posts/all", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Success! Response status:", response.status);
    console.log("Posts data:", {
      isArray: Array.isArray(response.data),
      count: Array.isArray(response.data) ? response.data.length : "Not array",
      firstPost: response.data[0]
        ? {
            id: response.data[0]._id,
            user: response.data[0].user,
            caption: response.data[0].caption,
          }
        : "No first post",
    });
  } catch (error) {
    console.error("❌ API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

testAPI();
