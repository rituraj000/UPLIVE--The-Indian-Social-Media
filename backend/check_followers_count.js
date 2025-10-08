const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function checkFollowersCount() {
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
    console.log("Followers Array Length:", user.followers.length);
    console.log("Followers Count (Virtual):", user.followerCount);
    console.log(
      "Followers IDs:",
      user.followers.map((id) => id.toString())
    );

    // Check if followers array has any invalid entries
    const validFollowers = [];
    for (const followerId of user.followers) {
      const followerUser = await User.findById(followerId);
      if (followerUser) {
        validFollowers.push({
          id: followerId.toString(),
          username: followerUser.username,
        });
      } else {
        console.log("⚠️ Invalid follower ID found:", followerId.toString());
      }
    }

    console.log("\nValid Followers:", validFollowers);
    console.log("Valid Followers Count:", validFollowers.length);

    // If there are invalid IDs, clean them up
    if (validFollowers.length !== user.followers.length) {
      console.log("\n🔧 Cleaning up invalid follower IDs...");
      user.followers = validFollowers.map((f) => f.id);
      await user.save();
      console.log("✅ Followers list cleaned up");

      // Refresh and check again
      const updatedUser = await User.findOne({ username: "Ritu_Raj" });
      console.log("Updated Followers Count:", updatedUser.followerCount);
    }

    // Also check if the user appears in other users' following lists incorrectly
    console.log("\n🔍 Checking who is following this user...");
    const usersFollowingMe = await User.find({
      following: user._id,
    }).select("username following");

    console.log("Users following me in their following arrays:");
    usersFollowingMe.forEach((u) => {
      console.log(`- ${u.username} (ID: ${u._id})`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkFollowersCount();
