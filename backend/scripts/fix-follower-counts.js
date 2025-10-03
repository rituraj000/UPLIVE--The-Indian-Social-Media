const mongoose = require("mongoose");
const User = require("../models/User");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/instagram-clone"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const fixFollowerCounts = async () => {
  try {
    console.log("🔍 Starting follower count fix...");

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to check`);

    let fixedCount = 0;

    for (const user of users) {
      let hasIssues = false;
      const originalFollowersLength = user.followers.length;
      const originalFollowingLength = user.following.length;

      // Remove duplicates from followers array
      const uniqueFollowers = [
        ...new Set(user.followers.map((id) => id.toString())),
      ];
      if (uniqueFollowers.length !== user.followers.length) {
        console.log(
          `🔧 User ${user.username}: Removing ${
            user.followers.length - uniqueFollowers.length
          } duplicate followers`
        );
        user.followers = uniqueFollowers;
        hasIssues = true;
      }

      // Remove duplicates from following array
      const uniqueFollowing = [
        ...new Set(user.following.map((id) => id.toString())),
      ];
      if (uniqueFollowing.length !== user.following.length) {
        console.log(
          `🔧 User ${user.username}: Removing ${
            user.following.length - uniqueFollowing.length
          } duplicate following`
        );
        user.following = uniqueFollowing;
        hasIssues = true;
      }

      // Remove self-follows (user following themselves)
      const followersWithoutSelf = user.followers.filter(
        (id) => id.toString() !== user._id.toString()
      );
      if (followersWithoutSelf.length !== user.followers.length) {
        console.log(`🔧 User ${user.username}: Removing self from followers`);
        user.followers = followersWithoutSelf;
        hasIssues = true;
      }

      const followingWithoutSelf = user.following.filter(
        (id) => id.toString() !== user._id.toString()
      );
      if (followingWithoutSelf.length !== user.following.length) {
        console.log(`🔧 User ${user.username}: Removing self from following`);
        user.following = followingWithoutSelf;
        hasIssues = true;
      }

      if (hasIssues) {
        await user.save();
        fixedCount++;
        console.log(
          `✅ Fixed ${user.username}: Followers ${originalFollowersLength} → ${user.followers.length}, Following ${originalFollowingLength} → ${user.following.length}`
        );
      }
    }

    console.log(`\n🎉 Fix complete! Updated ${fixedCount} users`);

    // Verify counts after fix
    console.log("\n📊 Verification:");
    for (const user of users) {
      const updatedUser = await User.findById(user._id);
      const followerCount = updatedUser.followers.length;
      const followingCount = updatedUser.following.length;
      console.log(
        `${updatedUser.username}: ${followerCount} followers, ${followingCount} following`
      );
    }
  } catch (error) {
    console.error("❌ Error fixing follower counts:", error);
  }
};

const main = async () => {
  await connectDB();
  await fixFollowerCounts();
  await mongoose.disconnect();
  console.log("✅ Database connection closed");
  process.exit(0);
};

// Handle environment variables
require("dotenv").config();

main().catch(console.error);
