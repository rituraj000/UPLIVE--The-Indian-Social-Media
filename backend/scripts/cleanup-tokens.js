#!/usr/bin/env node

const mongoose = require("mongoose");
const emailVerificationService = require("../services/emailVerificationService");
require("dotenv").config();

async function cleanupExpiredTokens() {
  try {
    console.log("🧹 Starting cleanup of expired email verification tokens...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Run cleanup
    const deletedCount = await emailVerificationService.cleanupExpiredTokens();
    
    console.log(`✅ Cleanup completed. Deleted ${deletedCount} expired tokens.`);
    
    // Close connection
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupExpiredTokens();
}

module.exports = cleanupExpiredTokens;