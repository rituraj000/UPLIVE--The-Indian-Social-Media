// Quick test to verify production CORS is working
const https = require("https");

// Test CORS with health endpoint
const testHealthCORS = () => {
  const options = {
    hostname: "uplive-the-indian-social-media.onrender.com",
    port: 443,
    path: "/api/health",
    method: "GET",
    headers: {
      Origin: "https://uplive-the-indian-social-media.vercel.app",
      "Content-Type": "application/json",
    },
  };

  const req = https.request(options, (res) => {
    console.log("\n=== HEALTH ENDPOINT CORS TEST ===");
    console.log(`Status: ${res.statusCode}`);
    console.log("Headers:", res.headers);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Response:", data);
      console.log("✅ Health endpoint CORS test completed\n");

      // Test CORS test endpoint
      testCORSEndpoint();
    });
  });

  req.on("error", (error) => {
    console.error("❌ Health CORS test failed:", error);
  });

  req.end();
};

// Test dedicated CORS endpoint
const testCORSEndpoint = () => {
  const options = {
    hostname: "uplive-the-indian-social-media.onrender.com",
    port: 443,
    path: "/api/cors-test",
    method: "GET",
    headers: {
      Origin: "https://uplive-the-indian-social-media.vercel.app",
      "Content-Type": "application/json",
    },
  };

  const req = https.request(options, (res) => {
    console.log("=== CORS TEST ENDPOINT ===");
    console.log(`Status: ${res.statusCode}`);
    console.log("Headers:", res.headers);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Response:", data);
      console.log("✅ CORS test endpoint completed\n");

      // Test POST request
      testPOSTRequest();
    });
  });

  req.on("error", (error) => {
    console.error("❌ CORS test failed:", error);
  });

  req.end();
};

// Test POST request (simulates registration)
const testPOSTRequest = () => {
  const postData = JSON.stringify({
    test: "data",
    origin: "vercel-frontend",
  });

  const options = {
    hostname: "uplive-the-indian-social-media.onrender.com",
    port: 443,
    path: "/api/emergency-test",
    method: "POST",
    headers: {
      Origin: "https://uplive-the-indian-social-media.vercel.app",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    console.log("=== POST REQUEST CORS TEST ===");
    console.log(`Status: ${res.statusCode}`);
    console.log("Headers:", res.headers);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Response:", data);
      console.log("✅ POST request CORS test completed\n");

      // Final summary
      console.log("🎉 ALL CORS TESTS COMPLETED!");
      console.log("\nNext steps:");
      console.log(
        "1. ✅ Test registration from frontend: https://uplive-the-indian-social-media.vercel.app"
      );
      console.log(
        "2. ✅ Check for specific error messages instead of generic 500s"
      );
      console.log("3. ✅ Monitor Render logs for startup messages");
      console.log(
        "4. ✅ Use debug endpoint if issues persist: /api/debug/registration-health"
      );
    });
  });

  req.on("error", (error) => {
    console.error("❌ POST request test failed:", error);
  });

  req.write(postData);
  req.end();
};

// Start tests
console.log("🧪 Testing production CORS configuration...");
console.log("Backend: https://uplive-the-indian-social-media.onrender.com");
console.log(
  "Frontend Origin: https://uplive-the-indian-social-media.vercel.app\n"
);

testHealthCORS();
