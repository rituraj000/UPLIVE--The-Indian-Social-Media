const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./backend/models/User");

async function checkFollowingCount() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/instagram-clone"
    );
    console.log("Connected to MongoDB");

    // Get the current user (Ritu_Raj)
    const user = await User.findOne({ username: "Ritu_Raj" });

    if (!user) {
      console.log("User not found");
      return;
    }

    console.log("User Details:");
    console.log("Username:", user.username);
    console.log("Following Array Length:", user.following.length);
    console.log("Following Count (Virtual):", user.followingCount);
    console.log(
      "Following IDs:",
      user.following.map((id) => id.toString())
    );

    // Check if following array has any invalid entries
    const validFollowing = [];
    for (const followingId of user.following) {
      const followedUser = await User.findById(followingId);
      if (followedUser) {
        validFollowing.push({
          id: followingId.toString(),
          username: followedUser.username,
        });
      } else {
        console.log("⚠️ Invalid following ID found:", followingId.toString());
      }
    }

    console.log("\nValid Following Users:", validFollowing);
    console.log("Valid Following Count:", validFollowing.length);

    // If there are invalid IDs, clean them up
    if (validFollowing.length !== user.following.length) {
      console.log("\n🔧 Cleaning up invalid following IDs...");
      user.following = validFollowing.map((f) => f.id);
      await user.save();
      console.log("✅ Following list cleaned up");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkFollowingCount();
