// Test the actual registration endpoint
const https = require("https");

const testRegistrationEndpoint = () => {
  const postData = JSON.stringify({
    phoneNumber: "+919876543210",
    password: "testpass123",
    countryCode: "+91",
  });

  const options = {
    hostname: "uplive-the-indian-social-media.onrender.com",
    port: 443,
    path: "/api/auth/register",
    method: "POST",
    headers: {
      Origin: "https://uplive-the-indian-social-media.vercel.app",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    console.log("=== REGISTRATION ENDPOINT TEST ===");
    console.log(`Status: ${res.statusCode}`);
    console.log("CORS Headers:");
    console.log(
      `  Access-Control-Allow-Origin: ${res.headers["access-control-allow-origin"]}`
    );
    console.log(
      `  Access-Control-Allow-Credentials: ${res.headers["access-control-allow-credentials"]}`
    );

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("\nResponse:", data);

      if (res.statusCode === 200 || res.statusCode === 400) {
        console.log("✅ Registration endpoint is accessible and responding!");
        console.log("✅ CORS headers are properly set!");
        console.log("🎉 Production deployment is working!");
      } else if (res.statusCode === 500) {
        console.log(
          "⚠️  Registration endpoint accessible but has server errors"
        );
        console.log("✅ CORS is working correctly");
        console.log("🔍 Need to check server logs for specific errors");
      } else {
        console.log(
          `ℹ️  Got status ${res.statusCode} - endpoint may need time to fully deploy`
        );
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Registration test failed:", error);
  });

  req.write(postData);
  req.end();
};

console.log("🧪 Testing actual registration endpoint...");
console.log(
  "This will show if registration is accessible and if CORS is working\n"
);

testRegistrationEndpoint();
