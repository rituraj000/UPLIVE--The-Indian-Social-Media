const mongoose = require("mongoose");
const Wallet = require("./models/Wallet");
require("dotenv").config();

// Test wallet creation
async function testWallet() {
  try {
    console.log("Testing wallet functionality...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/uplive"
    );
    console.log("✅ Connected to MongoDB");

    // Test wallet model creation
    const testWallet = new Wallet({
      user: new mongoose.Types.ObjectId(), // Generate a test user ID
      balance: 0,
      transactions: [],
    });

    console.log("✅ Wallet model creation test passed");

    // Test save operation
    await testWallet.save();
    console.log("✅ Wallet save operation test passed");

    // Test findOne operation
    const foundWallet = await Wallet.findOne({ user: testWallet.user });
    console.log("✅ Wallet findOne operation test passed");
    console.log("Wallet found:", foundWallet ? "Yes" : "No");

    // Clean up test data
    await Wallet.deleteOne({ _id: testWallet._id });
    console.log("✅ Test cleanup completed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Wallet test failed:", error);
    process.exit(1);
  }
}

testWallet();
