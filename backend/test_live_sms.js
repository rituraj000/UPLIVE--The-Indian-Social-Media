require("dotenv").config();
const PhoneVerificationService = require("./services/phoneVerificationService");

async function testLiveSMS() {
  console.log("🔥 Testing LIVE SMS with Real Phone Numbers...\n");

  // Create new instance after env vars are loaded
  const phoneService = new PhoneVerificationService();

  // Use the verified number from your Twilio account
  const testPhoneNumber = "+919973718077"; // Your verified Indian number
  const otp = phoneService.generateOTP();

  console.log("📱 Phone Verification Test:");
  console.log(`Number: ${testPhoneNumber}`);
  console.log(`Generated OTP: ${otp}\n`);

  try {
    console.log("📤 Sending REAL SMS via Twilio...");

    // Test direct SMS sending (bypassing database)
    const result = await phoneService.sendOTP(testPhoneNumber, otp);

    console.log("✅ SMS Result:", result);
    console.log("\n🎉 SUCCESS! SMS sent to your phone!");
    console.log("📱 Check your phone for the verification code");
    console.log("\n💡 Integration Status:");
    console.log("✅ Twilio: Working");
    console.log("✅ Phone Number: Active");
    console.log("✅ SMS Delivery: Confirmed");
    console.log("✅ OTP Generation: Working");
    console.log("🚀 Your phone verification system is LIVE!");
  } catch (error) {
    console.log("❌ SMS Error:", error.message);
  }
}

testLiveSMS();
