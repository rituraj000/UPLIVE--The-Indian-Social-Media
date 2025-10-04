const PhoneVerificationService = require("./services/phoneVerificationService");
require("dotenv").config();

async function testOTPSending() {
  console.log("🧪 Testing OTP Sending...\n");

  const phoneService = new PhoneVerificationService();

  // Test numbers (use your own number for testing)
  const testNumber = "+919876543210"; // Replace with a real number for testing

  try {
    console.log(`Testing OTP sending to: ${testNumber}`);

    // Generate a test OTP
    const testOTP = phoneService.generateOTP();
    console.log(`Generated OTP: ${testOTP}`);

    // Try to send SMS
    const result = await phoneService.sendOTP(testNumber, testOTP);
    console.log("✅ SMS sent successfully:", result);
  } catch (error) {
    console.error("❌ SMS sending failed:", error.message);

    // Provide specific troubleshooting based on error
    if (error.message.includes("Trial account")) {
      console.log("\n🔧 SOLUTION: Twilio trial account limitation");
      console.log(
        "   • Add your phone number to verified caller IDs in Twilio console"
      );
      console.log("   • Or upgrade to a paid account");
    } else if (error.message.includes("Invalid phone number")) {
      console.log("\n🔧 SOLUTION: Phone number format issue");
      console.log(
        "   • Ensure number is in international format (+country_code)"
      );
      console.log("   • Check if the number can receive SMS");
    } else if (error.message.includes("Geographic permissions")) {
      console.log("\n🔧 SOLUTION: Geographic restrictions");
      console.log(
        "   • Enable SMS permissions for the target country in Twilio console"
      );
    } else if (error.message.includes("No SMS provider")) {
      console.log("\n🔧 SOLUTION: Configure at least one SMS provider");
      console.log("   • Set up Twilio credentials in .env file");
      console.log("   • Or configure MSG91 for Indian numbers");
    }
  }
}

// Only run if called directly
if (require.main === module) {
  testOTPSending();
}

module.exports = testOTPSending;
