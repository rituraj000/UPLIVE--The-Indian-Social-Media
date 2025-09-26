const http = require("http");

function testAPI() {
  console.log("Testing Posts API endpoint...");

  const options = {
    hostname: "127.0.0.1",
    port: 5000,
    path: "/api/posts/test",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        console.log("✅ Success! Posts data:", {
          isArray: Array.isArray(jsonData),
          count: Array.isArray(jsonData) ? jsonData.length : "Not array",
          sample: jsonData[0] ? "Has posts" : "No posts",
        });
      } catch (error) {
        console.log("❌ Response (not JSON):", data);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Error:", error.message);
  });

  req.end();
}

testAPI();
