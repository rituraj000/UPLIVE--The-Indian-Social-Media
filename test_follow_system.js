// Test script to verify the new follow request system functionality
const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

// Test function to simulate the entire follow request workflow
async function testFollowRequestSystem() {
  console.log("🧪 Testing Follow Request System...\n");

  try {
    // Test 1: Check if duplicate key error is handled
    console.log("1️⃣ Testing duplicate follow request handling...");

    const testUserId = "68d3d980145434b4e0b1c000";
    const testToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQzYzc0ZGVhYzc1Y2MyYWYyZTcwYzQiLCJpYXQiOjE3Mjc0Nzc1MDYsImV4cCI6MTcyNzQ4NDcwNn0.your_token_here";

    const headers = {
      Authorization: `Bearer ${testToken}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(
        `${API_BASE}/users/${testUserId}/follow`,
        {},
        { headers }
      );
      console.log("✅ Follow request response:", response.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          "✅ Handled duplicate gracefully:",
          error.response.data.message
        );
      } else {
        console.log(
          "❌ Unexpected error:",
          error.response?.data || error.message
        );
      }
    }

    console.log("\n2️⃣ Testing cancel follow request...");
    try {
      const cancelResponse = await axios.delete(
        `${API_BASE}/users/${testUserId}/follow-request`,
        { headers }
      );
      console.log("✅ Cancel request response:", cancelResponse.data);
    } catch (error) {
      console.log(
        "ℹ️ Cancel request response:",
        error.response?.data?.message || error.message
      );
    }

    console.log("\n3️⃣ Testing send follow request again...");
    try {
      const resendResponse = await axios.post(
        `${API_BASE}/users/${testUserId}/follow`,
        {},
        { headers }
      );
      console.log("✅ Re-send request response:", resendResponse.data);
    } catch (error) {
      console.log(
        "ℹ️ Re-send request response:",
        error.response?.data?.message || error.message
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }

  console.log(
    "\n🏁 Test complete! Check the server logs for detailed backend processing."
  );
}

// Run the test
testFollowRequestSystem();
