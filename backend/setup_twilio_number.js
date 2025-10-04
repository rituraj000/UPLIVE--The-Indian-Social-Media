const twilio = require("twilio");
require("dotenv").config();

async function setupTwilioTrialNumber() {
  console.log("🔧 Setting up Twilio Trial Phone Number...\n");

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Check account status
    const account = await client.api
      .accounts(process.env.TWILIO_ACCOUNT_SID)
      .fetch();
    console.log(`Account Type: ${account.type}`);
    console.log(`Account Status: ${account.status}\n`);

    if (account.type === "Trial") {
      console.log("📱 Trial Account Setup Guide:");
      console.log(
        "1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
      );
      console.log('2. Click "Buy a number" or "Get a trial number"');
      console.log("3. Choose a number with SMS capabilities");
      console.log(
        "4. For India: Choose a number with +91 country code if available"
      );
      console.log(
        "5. For international: Choose a US number (+1) which works globally\n"
      );

      // Try to search for available numbers
      console.log("🔍 Searching for available trial numbers...");

      try {
        // Search for US numbers (most common for trial)
        const availableNumbers = await client
          .availablePhoneNumbers("US")
          .local.list({
            smsEnabled: true,
            limit: 3,
          });

        if (availableNumbers.length > 0) {
          console.log("✅ Available numbers for purchase:");
          availableNumbers.forEach((number, index) => {
            console.log(
              `${index + 1}. ${number.phoneNumber} - ${number.locality}, ${
                number.region
              }`
            );
          });

          console.log("\n💡 To get one of these numbers:");
          console.log("1. Go to Twilio Console");
          console.log("2. Purchase/claim the number");
          console.log("3. Update your .env file with the number");
        } else {
          console.log(
            "⚠️  No numbers available in search. Please check Twilio Console manually."
          );
        }
      } catch (searchError) {
        console.log("⚠️  Could not search for numbers automatically.");
        console.log("Please visit Twilio Console to get a phone number.");
      }

      console.log("\n🇮🇳 For Indian users:");
      console.log(
        "- Twilio trial works globally but you might want to consider MSG91 for India"
      );
      console.log(
        "- MSG91 offers better rates and delivery for Indian phone numbers"
      );
      console.log(
        "- You can use both: Twilio for international, MSG91 for India"
      );
    } else {
      console.log(
        "✅ Full account detected. You can purchase any available number."
      );
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

setupTwilioTrialNumber().catch(console.error);
