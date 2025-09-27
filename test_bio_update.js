// Test script to check if bio updates are working
const axios = require("axios");

async function testBioUpdate() {
  try {
    // Replace with actual username
    const username = "YOUR_USERNAME_HERE";
    const API_URL = "https://uplive-the-indian-social-media.onrender.com/api";

    // You'll need to get your auth token from the browser's localStorage
    // or login through the API first
    const token = "YOUR_AUTH_TOKEN_HERE";

    const response = await axios.get(`${API_URL}/users/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("User Bio from API:", response.data.bio);
    console.log("Full User Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "Error fetching user profile:",
      error.response?.data || error.message
    );
  }
}

console.log("To use this script:");
console.log("1. Replace YOUR_USERNAME_HERE with the actual username");
console.log("2. Replace YOUR_AUTH_TOKEN_HERE with your actual auth token");
console.log("3. Run: node test_bio_update.js");
console.log("");
console.log("To get your auth token:");
console.log("1. Open your browser");
console.log("2. Go to your UPLIVE app");
console.log("3. Open Developer Tools (F12)");
console.log("4. Go to Application/Storage tab");
console.log('5. Find "token" in localStorage');
console.log("");

// Uncomment this line after adding your credentials
// testBioUpdate();
