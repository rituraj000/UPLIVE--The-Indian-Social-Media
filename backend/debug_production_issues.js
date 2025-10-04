const mongoose = require("mongoose");
require("dotenv").config();

// Production debugging for SMS/Registration issues
async function debugProductionIssues() {
  console.log("🔍 Production SMS/Registration Debugging...\n");

  try {
    // Check MongoDB connection
    console.log("📂 Database Connection Check:");
    console.log(
      "MONGODB_URI:",
      process.env.MONGODB_URI ? "✅ Set" : "❌ Missing"
    );

    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB connected successfully");

        // Test collections
        const collections = await mongoose.connection.db
          .listCollections()
          .toArray();
        console.log(
          `📊 Available collections: ${collections
            .map((c) => c.name)
            .join(", ")}`
        );
      } catch (dbError) {
        console.error("❌ MongoDB connection failed:", dbError.message);
      }
    }

    console.log("\n📋 Environment Variables Check:");
    console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");
    console.log("PORT:", process.env.PORT || "undefined");
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

    console.log("\n🏭 Production Environment Checks:");

    // Check required models
    console.log("\n📄 Model Checks:");
    try {
      const PhoneVerification = require("./models/PhoneVerification");
      console.log("✅ PhoneVerification model loaded");
    } catch (error) {
      console.error("❌ PhoneVerification model error:", error.message);
    }

    try {
      const SMSRateLimit = require("./models/SMSRateLimit");
      console.log("✅ SMSRateLimit model loaded");
    } catch (error) {
      console.error("❌ SMSRateLimit model error:", error.message);
    }

    try {
      const User = require("./models/User");
      console.log("✅ User model loaded");
    } catch (error) {
      console.error("❌ User model error:", error.message);
    }

    // Check services
    console.log("\n🔧 Service Checks:");
    try {
      const PhoneVerificationService = require("./services/phoneVerificationService");
      const phoneService = new PhoneVerificationService();
      console.log("✅ PhoneVerificationService initialized");

      // Check SMS providers
      const hasProvider =
        phoneService.twilioClient ||
        phoneService.MSG91_API_KEY ||
        phoneService.sns;
      console.log(
        "SMS Providers:",
        hasProvider ? "✅ Available" : "❌ None configured"
      );
    } catch (error) {
      console.error("❌ PhoneVerificationService error:", error.message);
    }

    // Check utilities
    console.log("\n🛠️ Utility Checks:");
    try {
      const PhoneNumberValidator = require("./utils/phoneNumberValidator");
      console.log("✅ PhoneNumberValidator loaded");
    } catch (error) {
      console.error("❌ PhoneNumberValidator error:", error.message);
    }

    try {
      const SMSRateLimiter = require("./utils/smsRateLimiter");
      console.log("✅ SMSRateLimiter loaded");
    } catch (error) {
      console.error("❌ SMSRateLimiter error:", error.message);
    }

    console.log("\n🚨 Common Production Issues:");
    console.log("1. Missing environment variables in production");
    console.log("2. Database connection issues");
    console.log("3. Missing npm dependencies");
    console.log("4. File path issues (case sensitivity)");
    console.log("5. Memory/resource limits");
    console.log("6. Network restrictions");

    console.log("\n✅ Debug completed successfully");
  } catch (error) {
    console.error("❌ Debug script error:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

debugProductionIssues();
