const fetch = require("node-fetch");

async function testAPI() {
  console.log("Testing Posts API endpoint...");

  try {
    const response = await fetch("http://localhost:5000/api/posts/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("Success! Posts found:", {
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : "Not array",
        sample: data.slice ? data.slice(0, 1) : "No slice method",
      });
    } else {
      const errorText = await response.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("Network error:", error.message);
  }
}

testAPI();
