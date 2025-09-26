const mongoose = require("mongoose");
require("dotenv").config();

const testConnections = async () => {
  console.log("🔍 Testing database connections...\n");

  // Test 1: MongoDB Atlas connection
  console.log("1️⃣ Testing MongoDB Atlas connection...");
  console.log(
    "MongoDB URI:",
    process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/:[^:@]*@/, ":****@")
      : "NOT FOUND"
  );

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    console.log("✅ MongoDB Atlas connected successfully!");
    console.log("Database:", mongoose.connection.db.databaseName);
    console.log("Host:", mongoose.connection.host);
    console.log("Port:", mongoose.connection.port);

    // Test basic database operation
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📋 Available collections:",
      collections.map((c) => c.name)
    );

    await mongoose.disconnect();
    console.log("🔌 Disconnected from Atlas\n");
  } catch (atlasError) {
    console.log("❌ Atlas connection failed:", atlasError.message);
    console.log("Error code:", atlasError.code);
    console.log("Error name:", atlasError.name);

    if (atlasError.message.includes("authentication failed")) {
      console.log(
        "💡 This looks like an authentication issue - check username/password"
      );
    }
    if (atlasError.message.includes("network timeout")) {
      console.log(
        "💡 This looks like a network timeout - check your internet connection"
      );
    }
    if (atlasError.message.includes("ENOTFOUND")) {
      console.log(
        "💡 This looks like a DNS resolution issue - check the cluster URL"
      );
    }
    console.log("");
  }

  // Test 2: Local MongoDB connection
  console.log("2️⃣ Testing local MongoDB connection...");
  try {
    await mongoose.connect("mongodb://localhost:27017/instagram-clone", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });

    console.log("✅ Local MongoDB connected successfully!");
    console.log("Database:", mongoose.connection.db.databaseName);

    // Test basic database operation
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📋 Available collections:",
      collections.map((c) => c.name)
    );

    await mongoose.disconnect();
    console.log("🔌 Disconnected from local MongoDB\n");
  } catch (localError) {
    console.log("❌ Local MongoDB connection failed:", localError.message);
    if (localError.message.includes("ECONNREFUSED")) {
      console.log(
        "💡 MongoDB is not running locally. Start MongoDB service or install MongoDB Community Server"
      );
    }
    console.log("");
  }

  console.log("🏁 Database connection testing complete!");
  process.exit(0);
};

testConnections();
