// Debug current 500 error in production registration
const https = require("https");

async function testCurrentError() {
  console.log("🔍 Debugging current 500 error in registration...");

  // Test with realistic data that should work
  const testData = {
    phoneNumber: "+919876543210",
    username: "testuser999", // Short username to avoid length errors
    fullName: "Test User",
    password: "testpass123",
  };

  console.log("📤 Testing with data:", testData);

  const postData = JSON.stringify(testData);

  const options = {
    hostname: "uplive-the-indian-social-media.onrender.com",
    port: 443,
    path: "/api/auth/register",
    method: "POST",
    headers: {
      Origin: "https://uplive-the-indian-social-media.vercel.app",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      "User-Agent": "UPLIVE-Debug/1.0",
    },
    timeout: 20000,
  };

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    console.log(`⏰ Starting request at: ${new Date().toISOString()}`);

    const req = https.request(options, (res) => {
      const responseTime = Date.now() - startTime;

      console.log(`📊 Response received after: ${responseTime}ms`);
      console.log(`📈 Status Code: ${res.statusCode}`);
      console.log(`🔗 CORS Headers:`);
      console.log(
        `   Access-Control-Allow-Origin: ${res.headers["access-control-allow-origin"]}`
      );
      console.log(
        `   Access-Control-Allow-Credentials: ${res.headers["access-control-allow-credentials"]}`
      );

      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        const totalTime = Date.now() - startTime;
        console.log(`⏱️  Total time: ${totalTime}ms`);

        try {
          const parsed = JSON.parse(responseData);
          console.log("\n📝 Parsed Response:");
          console.log("   Message:", parsed.message);
          if (parsed.error) {
            console.log("   Error:", parsed.error);
          }
          if (parsed.errors) {
            console.log(
              "   Validation Errors:",
              JSON.stringify(parsed.errors, null, 2)
            );
          }

          resolve({
            status: res.statusCode,
            data: parsed,
            time: totalTime,
          });
        } catch (parseError) {
          console.log("\n📝 Raw Response (couldn't parse JSON):");
          console.log(responseData.substring(0, 500));
          resolve({
            status: res.statusCode,
            data: responseData,
            time: totalTime,
          });
        }
      });
    });

    req.on("timeout", () => {
      console.log("⏰ Request timed out after 20 seconds");
      req.abort();
      reject(new Error("Timeout"));
    });

    req.on("error", (error) => {
      console.log(`❌ Request error: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function debugRegistration() {
  try {
    const result = await testCurrentError();

    console.log("\n🔍 ANALYSIS:");

    if (result.status === 400) {
      console.log(
        "✅ Validation working - server processing requests correctly"
      );
      console.log("🔧 Issue: Form validation errors");
    } else if (result.status === 500) {
      console.log("❌ Server error - internal issue needs fixing");
      console.log("🔧 Issue: Server-side error in registration logic");
    } else if (result.status === 201) {
      console.log("✅ Registration working perfectly!");
    } else {
      console.log(`❓ Unexpected status: ${result.status}`);
    }

    if (result.time > 5000) {
      console.log("⚠️  Slow response - likely SMS service timeout");
    } else {
      console.log("✅ Response time acceptable");
    }

    console.log("\n💡 NEXT STEPS:");
    if (result.status === 500) {
      console.log("1. Check server logs in Render dashboard");
      console.log("2. Look for specific error messages");
      console.log("3. Check if SMS service is causing issues");
      console.log("4. Try email registration instead");
    } else {
      console.log("1. Server is working correctly");
      console.log("2. Users should be able to register");
    }
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

console.log("🚨 DEBUGGING CURRENT 500 ERROR");
console.log("===============================");

debugRegistration();
