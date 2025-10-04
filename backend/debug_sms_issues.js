const PhoneVerificationService = require("./services/phoneVerificationService");
require("dotenv").config();

async function debugSMSIssues() {
  console.log("🔍 Debugging SMS OTP Issues...\n");

  // Check environment variables
  console.log("📋 Environment Variables Check:");
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
  console.log(
    "MSG91_API_KEY:",
    process.env.MSG91_API_KEY ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "MSG91_SENDER_ID:",
    process.env.MSG91_SENDER_ID ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "MSG91_TEMPLATE_ID:",
    process.env.MSG91_TEMPLATE_ID ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "AWS_ACCESS_KEY_ID:",
    process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "AWS_SECRET_ACCESS_KEY:",
    process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing"
  );
  console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");
  console.log("");

  // Initialize SMS service
  const phoneService = new PhoneVerificationService();

  // Test phone number formatting
  console.log("📱 Phone Number Formatting Tests:");
  const testNumbers = [
    "9876543210", // Indian number without country code
    "+919876543210", // Indian number with country code
    "919876543210", // Indian number with country code but no +
    "+1234567890", // US number
    "1234567890", // US number without country code
  ];

  testNumbers.forEach((number) => {
    const formatted = phoneService.formatPhoneNumber(number);
    console.log(`${number} → ${formatted}`);
  });
  console.log("");

  // Test SMS sending (without actually sending)
  console.log("🚀 SMS Provider Availability:");

  // Test Twilio
  if (phoneService.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    console.log("✅ Twilio: Available");
    try {
      // Test Twilio credentials by checking account
      const account = await phoneService.twilioClient.api
        .accounts(process.env.TWILIO_ACCOUNT_SID)
        .fetch();
      console.log(`   Account Status: ${account.status}`);
      console.log(`   Account Type: ${account.type}`);
    } catch (error) {
      console.log(`   ❌ Twilio Error: ${error.message}`);
    }
  } else {
    console.log("❌ Twilio: Not configured");
  }

  // Test MSG91
  if (phoneService.MSG91_API_KEY && phoneService.MSG91_SENDER_ID) {
    console.log("✅ MSG91: Available");
  } else {
    console.log("❌ MSG91: Not configured");
  }

  // Test AWS SNS
  if (phoneService.sns) {
    console.log("✅ AWS SNS: Available");
    try {
      // Test AWS SNS by getting SMS attributes
      const attributes = await phoneService.sns.getSMSAttributes().promise();
      console.log("   SMS Attributes retrieved successfully");
    } catch (error) {
      console.log(`   ❌ AWS SNS Error: ${error.message}`);
    }
  } else {
    console.log("❌ AWS SNS: Not configured");
  }

  console.log("");

  // Common issues and solutions
  console.log("🔧 Common Issues and Solutions:");
  console.log("");
  console.log('1. ❌ "Failed to send OTP" - Generic Error');
  console.log("   Solutions:");
  console.log("   • Check if at least one SMS provider is configured");
  console.log("   • Verify environment variables are loaded correctly");
  console.log("   • Check network connectivity");
  console.log("   • Verify phone number format");
  console.log("");

  console.log("2. ❌ Twilio Errors:");
  console.log(
    "   • Invalid credentials (401) - Check ACCOUNT_SID and AUTH_TOKEN"
  );
  console.log("   • Invalid phone number (400) - Check number format");
  console.log("   • Insufficient funds - Check Twilio balance");
  console.log("   • Geographic restrictions - Some countries blocked");
  console.log("");

  console.log("3. ❌ MSG91 Errors:");
  console.log("   • Invalid API key - Check MSG91_API_KEY");
  console.log("   • Template not approved - Check MSG91_TEMPLATE_ID");
  console.log("   • DND numbers - Some Indian numbers have DND enabled");
  console.log("");

  console.log("4. ❌ Rate Limiting:");
  console.log("   • Too many requests - Implement user-based rate limiting");
  console.log("   • SMS provider limits - Check daily/monthly limits");
  console.log("");

  console.log("5. ❌ Phone Number Issues:");
  console.log(
    "   • Invalid format - Should be international format (+country_code)"
  );
  console.log("   • Landline numbers - Cannot receive SMS");
  console.log("   • Blocked numbers - Provider blocklists");
  console.log("");
}

// Run the debug
debugSMSIssues().catch((error) => {
  console.error("Debug script error:", error);
});
