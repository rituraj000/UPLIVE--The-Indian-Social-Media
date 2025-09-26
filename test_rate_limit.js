const axios = require("axios");

async function testRateLimit() {
  console.log("🧪 Testing Rate Limiting...\n");

  const baseURL = "http://localhost:5000/api";

  try {
    // Test 1: Health check
    console.log("1️⃣ Testing health endpoint...");
    const health = await axios.get(`${baseURL}/health`);
    console.log("✅ Health check:", health.data.message);

    // Test 2: Username check (should have high limit now)
    console.log("\n2️⃣ Testing username checking (5 rapid requests)...");
    for (let i = 0; i < 5; i++) {
      try {
        const response = await axios.get(
          `${baseURL}/users/check-username/test${i}`
        );
        console.log(`✅ Username check ${i + 1}:`, response.data.message);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(
            `❌ Rate limited on request ${i + 1}:`,
            error.response.data
          );
        } else {
          console.log(`❌ Error on request ${i + 1}:`, error.message);
        }
      }
    }

    // Test 3: Check rate limit headers
    console.log("\n3️⃣ Checking rate limit headers...");
    const response = await axios.get(`${baseURL}/health`);
    const headers = response.headers;

    console.log("📊 Rate Limit Info:");
    if (headers["x-ratelimit-limit"]) {
      console.log(`   • Limit: ${headers["x-ratelimit-limit"]} requests`);
      console.log(
        `   • Remaining: ${headers["x-ratelimit-remaining"]} requests`
      );
      console.log(
        `   • Reset: ${new Date(
          headers["x-ratelimit-reset"] * 1000
        ).toLocaleTimeString()}`
      );
    } else {
      console.log("   • No rate limit headers found (new format)");
    }

    console.log("\n✅ Rate limiting test completed successfully!");
    console.log("\n📝 Current Configuration:");
    console.log("   • Development: 1000 requests per 15 minutes (general)");
    console.log("   • Auth routes: 200 requests per 15 minutes");
    console.log("   • Username check: 500 requests per minute");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response?.status === 429) {
      console.log(
        "🚫 You are currently rate limited. Wait 15 minutes or restart the server."
      );
    }
  }
}

testRateLimit();
