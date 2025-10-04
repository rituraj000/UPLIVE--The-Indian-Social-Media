require("dotenv").config();

console.log("🔍 Debugging Phone Verification Service...\n");

console.log("Environment Variables:");
console.log(
  "TWILIO_ACCOUNT_SID:",
  process.env.TWILIO_ACCOUNT_SID ? "Set ✅" : "Missing ❌"
);
console.log(
  "TWILIO_AUTH_TOKEN:",
  process.env.TWILIO_AUTH_TOKEN ? "Set ✅" : "Missing ❌"
);
console.log(
  "TWILIO_PHONE_NUMBER:",
  process.env.TWILIO_PHONE_NUMBER ? "Set ✅" : "Missing ❌"
);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log();

// Test Twilio initialization
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require("twilio");
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log("✅ Twilio client initialized");
} else {
  console.log("❌ Twilio client NOT initialized");
}

console.log("twilioClient exists:", !!twilioClient);
console.log("TWILIO_PHONE_NUMBER exists:", !!process.env.TWILIO_PHONE_NUMBER);
console.log(
  "Both conditions met:",
  !!(twilioClient && process.env.TWILIO_PHONE_NUMBER)
);

// Test the exact condition from phone verification service
if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
  console.log("✅ Twilio should be used (not mock)");

  // Test sending SMS
  async function testSMS() {
    try {
      const message = await twilioClient.messages.create({
        body: "🧪 Debug Test: UPLIVE OTP verification working!",
        from: process.env.TWILIO_PHONE_NUMBER,
        to: "+919973718077",
      });
      console.log("✅ Debug SMS sent:", message.sid);
    } catch (error) {
      console.log("❌ Debug SMS failed:", error.message);
    }
  }

  testSMS();
} else {
  console.log("❌ Conditions not met - will use mock SMS");
}
