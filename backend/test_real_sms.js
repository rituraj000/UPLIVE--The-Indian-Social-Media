const twilio = require("twilio");
require("dotenv").config();

async function sendTestSMS() {
  console.log("🧪 Testing Real SMS Sending...\n");

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log("❌ Missing Twilio credentials");
    return;
  }

  const client = twilio(accountSid, authToken);

  try {
    // Check account and phone number status
    console.log("📋 Current Setup:");
    console.log(`From Number: ${fromNumber}`);

    const account = await client.api.accounts(accountSid).fetch();
    console.log(`Account: ${account.type} (${account.status})\n`);

    // List verified numbers (for trial accounts)
    console.log("🔍 Checking verified numbers...");
    try {
      const verifiedNumbers = await client.outgoingCallerIds.list();

      if (verifiedNumbers.length === 0) {
        console.log("⚠️  No verified numbers found");
        console.log("\n📞 To verify your phone number:");
        console.log(
          "1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
        );
        console.log('2. Click "Add a new number"');
        console.log("3. Enter your phone number (e.g., +919876543210)");
        console.log("4. Complete verification via SMS/Call");
        console.log("5. Run this test again\n");
        return;
      }

      console.log("✅ Verified numbers available:");
      verifiedNumbers.forEach((number, index) => {
        console.log(
          `${index + 1}. ${number.phoneNumber} - ${number.friendlyName}`
        );
      });

      // Test SMS to first verified number
      const testNumber = verifiedNumbers[0].phoneNumber;
      const testMessage = `🇮🇳 UPLIVE Test SMS - Your verification system is working! Time: ${new Date().toLocaleTimeString()}`;

      console.log(`\n📤 Sending test SMS to ${testNumber}...`);

      const message = await client.messages.create({
        body: testMessage,
        from: fromNumber,
        to: testNumber,
      });

      console.log("✅ SMS sent successfully!");
      console.log(`Message SID: ${message.sid}`);
      console.log(`Status: ${message.status}`);
      console.log(`To: ${message.to}`);
      console.log(`From: ${message.from}`);
      console.log(`Message: ${message.body}\n`);

      console.log("🎉 Your Twilio SMS integration is fully working!");
      console.log("🚀 Phone verification system is ready for production!");
    } catch (verifyError) {
      console.log("⚠️  Could not fetch verified numbers:", verifyError.message);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);

    if (error.code === 21211) {
      console.log(
        "💡 Invalid phone number format. Use E.164 format: +1234567890"
      );
    } else if (error.code === 21408) {
      console.log(
        "💡 Permission denied. This number is not verified for trial account."
      );
      console.log(
        "   Add and verify your phone number in Twilio Console first."
      );
    }
  }
}

sendTestSMS();
