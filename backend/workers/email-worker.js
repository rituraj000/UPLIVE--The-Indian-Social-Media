#!/usr/bin/env node

const mongoose = require("mongoose");
require("dotenv").config();

// Import email services to start the worker
const emailQueue = require("../services/emailQueue");

async function startEmailWorker() {
  try {
    console.log("🚀 Starting UPLIVE Email Worker...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    console.log("📧 Email worker is running and processing jobs...");
    console.log("Press Ctrl+C to stop the worker");
    
    // Keep the process running
    process.on('SIGTERM', async () => {
      console.log('📧 Email worker shutting down...');
      await mongoose.connection.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📧 Email worker shutting down...');
      await mongoose.connection.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Failed to start email worker:", error.message);
    process.exit(1);
  }
}

startEmailWorker();