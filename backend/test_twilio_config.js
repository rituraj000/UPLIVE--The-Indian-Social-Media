const twilio = require("twilio");
require("dotenv").config();

// Test Twilio configuration
async function testTwilioConfig() {
  console.log("🔧 Testing Twilio Configuration...\n");

  // Check if credentials are loaded
  console.log("Environment Variables:");
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
    console.log("❌ Missing Twilio credentials in .env file");
    return;
  }

  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Test API connection by fetching account info
    console.log("📞 Testing Twilio API connection...");
    const account = await client.api
      .accounts(process.env.TWILIO_ACCOUNT_SID)
      .fetch();

    console.log("✅ Twilio API connection successful!");
    console.log("Account SID:", account.sid);
    console.log("Account Status:", account.status);
    console.log("Account Type:", account.type);
    console.log();

    // List available phone numbers
    console.log("📱 Checking available phone numbers...");
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });

    if (phoneNumbers.length > 0) {
      console.log("✅ Available phone numbers:");
      phoneNumbers.forEach((number, index) => {
        console.log(
          `${index + 1}. ${number.phoneNumber} (${number.friendlyName})`
        );
      });

      // Update the .env file with the first available number if TWILIO_PHONE_NUMBER looks incorrect
      const firstNumber = phoneNumbers[0].phoneNumber;
      console.log(`\n💡 Suggested TWILIO_PHONE_NUMBER: ${firstNumber}`);
    } else {
      console.log("⚠️  No phone numbers found in your Twilio account");
      console.log("   You need to purchase a phone number from Twilio Console");
    }
  } catch (error) {
    console.log("❌ Twilio configuration error:");
    console.log("Error:", error.message);

    if (error.code === 20003) {
      console.log(
        "💡 This looks like an authentication error - please check your credentials"
      );
    } else if (error.code === 21608) {
      console.log("💡 Phone number verification error");
    }
  }
}

// Run the test
testTwilioConfig().catch(console.error);
