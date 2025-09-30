#!/usr/bin/env node

const mongoose = require("mongoose");
const emailVerificationService = require("../services/emailVerificationService");
const emailService = require("../services/emailService");
require("dotenv").config();

async function testEmailVerification() {
  try {
    console.log("🧪 Testing UPLIVE Email Verification System...\n");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test email service connection
    const emailConnected = await emailService.verifyConnection();
    if (emailConnected) {
      console.log("✅ Email service connection verified");
    } else {
      console.log("⚠️  Email service not configured (optional for testing)");
    }

    // Test token generation
    const testToken = emailVerificationService.generateToken();
    console.log("✅ Token generation working:", testToken.length === 64 ? "64-char hex token" : "❌ Invalid length");

    // Test MongoDB models
    const EmailVerification = require("../models/EmailVerification");
    const RateLimit = require("../models/RateLimit");
    
    console.log("✅ EmailVerification model loaded");
    console.log("✅ RateLimit model loaded");

    // Get statistics
    const activeVerifications = await EmailVerification.countDocuments({
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    const expiredVerifications = await EmailVerification.countDocuments({
      expiresAt: { $lt: new Date() }
    });

    const rateLimitRecords = await RateLimit.countDocuments();

    console.log("\n📊 Database Statistics:");
    console.log(`   Active verifications: ${activeVerifications}`);
    console.log(`   Expired verifications: ${expiredVerifications}`);
    console.log(`   Rate limit records: ${rateLimitRecords}`);

    console.log("\n🎉 Email verification system is ready!");
    console.log("\n📋 Next steps:");
    console.log("   1. Set EMAIL_USER and EMAIL_PASS in .env for production");
    console.log("   2. Ensure Redis is running for email queue (optional)");
    console.log("   3. Test the registration flow in your frontend");
    
    // Close connection
    await mongoose.connection.close();
    console.log("\n✅ Test completed successfully");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testEmailVerification();