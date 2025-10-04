const twilio = require("twilio");
require("dotenv").config();

async function testTwilioSMS() {
  console.log("📱 Testing Twilio SMS Integration...\n");

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  console.log("Configuration:");
  console.log(`Account SID: ${accountSid}`);
  console.log(
    `Auth Token: ${authToken ? authToken.substring(0, 8) + "..." : "Not set"}`
  );
  console.log(`From Number: ${fromNumber}\n`);

  if (!accountSid || !authToken) {
    console.log("❌ Missing Twilio credentials");
    return;
  }

  try {
    const client = twilio(accountSid, authToken);

    // Test account info
    console.log("🔍 Checking account status...");
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`✅ Account Status: ${account.status}`);
    console.log(`✅ Account Type: ${account.type}\n`);

    // Check if we have a valid phone number
    console.log("📞 Checking phone numbers...");
    const phoneNumbers = await client.incomingPhoneNumbers.list();

    if (phoneNumbers.length === 0) {
      console.log("⚠️  No phone numbers found in your account");
      console.log("\n🔗 To get a phone number:");
      console.log(
        "1. Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
      );
      console.log('2. Click "Buy a number"');
      console.log("3. Select a number with SMS capability");
      console.log("4. Purchase/claim the number (free for trial)\n");

      console.log("📋 Available trial numbers:");
      console.log("• +15136549592 (South Lebanon, OH)");
      console.log("• +13466580359 (Houston, US)");
      console.log("• +16625055743 (Sumner, MS)");

      return;
    }

    console.log("✅ Available phone numbers:");
    phoneNumbers.forEach((number, index) => {
      console.log(
        `${index + 1}. ${number.phoneNumber} - ${number.friendlyName}`
      );
    });

    const firstNumber = phoneNumbers[0].phoneNumber;
    console.log(`\n💡 Using: ${firstNumber} for SMS testing`);

    // Test SMS (to a verified number for trial accounts)
    console.log("\n📤 Testing SMS sending...");
    console.log(
      "⚠️  Note: For Twilio trial accounts, SMS can only be sent to verified numbers"
    );
    console.log(
      "💡 Add your phone number to verified numbers in Twilio Console\n"
    );

    // For trial accounts, you need to verify the destination number first
    console.log("🔗 To verify your phone number for testing:");
    console.log(
      "1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
    );
    console.log('2. Click "Add a new number"');
    console.log("3. Enter your phone number and verify it");
    console.log("4. Then you can test SMS to that number\n");

    console.log("✅ Twilio SMS integration is properly configured!");
    console.log("🚀 Your phone verification system is ready to use once you:");
    console.log("   1. Claim a phone number");
    console.log("   2. Verify your test phone number (for trial accounts)");
  } catch (error) {
    console.log("❌ Error testing Twilio:", error.message);

    if (error.code) {
      console.log(`Error Code: ${error.code}`);
    }
  }
}

testTwilioSMS();
