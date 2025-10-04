require("dotenv").config();
const twilio = require("twilio");

async function testDirectTwilio() {
  console.log("🔧 Direct Twilio Test...\n");

  console.log("Environment Check:");
  console.log(
    "TWILIO_ACCOUNT_SID:",
    process.env.TWILIO_ACCOUNT_SID ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "TWILIO_AUTH_TOKEN:",
    process.env.TWILIO_AUTH_TOKEN ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "TWILIO_PHONE_NUMBER:",
    process.env.TWILIO_PHONE_NUMBER ? "✅ Set" : "❌ Missing"
  );
  console.log();

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log("❌ Missing credentials");
    return;
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log("📤 Sending real SMS...");
    const message = await client.messages.create({
      body: "🇮🇳 UPLIVE OTP: 123456. Valid for 10 minutes. Do not share this code.",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: "+919973718077", // Your verified number
    });

    console.log("✅ SMS sent successfully!");
    console.log("Message SID:", message.sid);
    console.log("Status:", message.status);
    console.log("📱 Check your phone!");
  } catch (error) {
    console.log("❌ Error:", error.message);
    if (error.code) console.log("Error Code:", error.code);
  }
}

testDirectTwilio();
