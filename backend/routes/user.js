const express = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const FollowRequest = require("../models/FollowRequest");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { createNotification } = require("./notification");

const router = express.Router();

// Username check rate limiter
const usernameCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 50 : 500,
  message: {
    error: "Too many username checks, please wait a moment.",
    retryAfter: "1 minute",
  },
});

// Check username availability
router.get(
  "/check-username/:username",
  usernameCheckLimiter,
  async (req, res) => {
    try {
      const { username } = req.params;

      // Check if username meets basic requirements
      if (!username || username.length < 3 || username.length > 20) {
        return res.json({
          available: false,
          message: "Username must be 3-20 characters long",
        });
      }

      // Check if username contains only allowed characters (letters, numbers, underscore, period)
      const usernameRegex = /^[a-zA-Z0-9._]+$/;
      if (!usernameRegex.test(username)) {
        return res.json({
          available: false,
          message:
            "Username can only contain letters, numbers, periods, and underscores",
        });
      }

      // Check if username is already taken
      const existingUser = await User.findOne({
        username: new RegExp(`^${username}$`, "i"), // Case insensitive
      });

      if (existingUser) {
        return res.json({
          available: false,
          message: "This username is already taken",
        });
      }

      res.json({
        available: true,
        message: "Username is available",
      });
    } catch (error) {
      console.error("Check username error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get user profile
router.get("/:username", auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate({
        path: "posts",
        populate: {
          path: "user",
          select: "username fullName profilePicture isVerified",
        },
      })
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUserId = req.user.userId;
    const isOwnProfile = user._id.toString() === currentUserId;
    const isFollowing = user.followers.some(
      (follower) => follower._id.toString() === currentUserId
    );

    // Check if there's a follow request (pending or declined)
    let hasRequestedToFollow = false;
    let followRequestStatus = null;
    if (!isOwnProfile && !isFollowing && user.isPrivate) {
      const followRequest = await FollowRequest.findOne({
        fromUser: currentUserId,
        toUser: user._id,
      });
      if (followRequest) {
        hasRequestedToFollow = followRequest.status === "pending";
        followRequestStatus = followRequest.status;
      }
    }

    // For private accounts, hide posts if not following (unless it's own profile)
    let userResponse = user.toJSON();
    if (user.isPrivate && !isOwnProfile && !isFollowing) {
      userResponse.posts = [];
    }

    // Add relationship info
    userResponse.isFollowing = isFollowing;
    userResponse.hasRequestedToFollow = hasRequestedToFollow;
    userResponse.followRequestStatus = followRequestStatus;
    userResponse.isOwnProfile = isOwnProfile;

    res.json(userResponse);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put(
  "/profile",
  auth,
  upload.single("profilePicture"),
  [
    body("fullName").optional().trim().escape(),
    body("bio").optional().isLength({ max: 150 }).trim().escape(),
    body("website").optional().trim(),
    body("username")
      .optional()
      .isLength({ min: 3, max: 20 })
      .trim()
      .matches(/^[a-zA-Z0-9._]+$/),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update fields
      const { fullName, bio, website, isPrivate, username } = req.body;
      if (fullName) user.fullName = fullName;
      if (bio !== undefined) user.bio = bio;
      if (website !== undefined) user.website = website;
      if (isPrivate !== undefined) user.isPrivate = isPrivate;

      // Handle username update
      if (username && username !== user.username) {
        // Check if username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
        user.username = username;
      }

      if (req.file) {
        user.profilePicture = req.file.path; // Cloudinary URL
      }

      await user.save();

      res.json({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        website: user.website,
        profilePicture: user.profilePicture,
        isPrivate: user.isPrivate,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update user profile settings (non-file fields)
router.put("/profile/settings", auth, async (req, res) => {
  try {
    const allowedUpdates = [
      "hasSeenWelcome",
      "isPrivate",
      "fullName",
      "bio",
      "website",
    ];
    const updates = {};

    // Only allow specific fields to be updated
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      select: "-password",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Update profile settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Follow/Unfollow user
router.post("/:userId/follow", auth, async (req, res) => {
  try {
    console.log("🔍 Follow request:", {
      currentUserId: req.user.userId,
      targetUserId: req.params.userId,
    });

    const targetUser = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.userId);

    if (!targetUser || !currentUser) {
      console.log("❌ User not found:", {
        targetUser: !!targetUser,
        currentUser: !!currentUser,
      });
      return res.status(404).json({ message: "User not found" });
    }

    if (req.params.userId === req.user.userId) {
      console.log("❌ Cannot follow yourself");
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const isFollowing = currentUser.following.includes(req.params.userId);
    console.log("🔍 Currently following:", isFollowing);

    if (isFollowing) {
      console.log("❌ Already following this user");
      return res.status(400).json({ message: "Already following this user" });
    }

    // If target account is private, send follow request instead
    if (targetUser.isPrivate) {
      // Check if follow request already exists (any status)
      const existingRequest = await FollowRequest.findOne({
        fromUser: req.user.userId,
        toUser: req.params.userId,
      });

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          return res.json({
            message: "Follow request already sent",
            requested: true,
          });
        } else if (
          existingRequest.status === "declined" ||
          existingRequest.status === "accepted"
        ) {
          // Update declined or accepted request back to pending
          // This handles the case when user unfollows and wants to follow again
          existingRequest.status = "pending";
          await existingRequest.save();

          // Create new follow request notification
          await createNotification(
            "follow_request",
            req.user.userId,
            req.params.userId
          );

          return res.json({
            message: "Follow request sent",
            requested: true,
          });
        }
      }

      try {
        // Create new follow request
        const followRequest = new FollowRequest({
          fromUser: req.user.userId,
          toUser: req.params.userId,
        });

        await followRequest.save();

        // Create follow request notification
        await createNotification(
          "follow_request",
          req.user.userId,
          req.params.userId
        );

        return res.json({
          message: "Follow request sent",
          requested: true,
        });
      } catch (duplicateError) {
        // Handle duplicate key error gracefully
        if (duplicateError.code === 11000) {
          return res.status(400).json({
            message: "Follow request already sent",
            requested: true,
          });
        }
        throw duplicateError;
      }
    }

    // Follow public account directly
    // Check for duplicates before adding
    if (!currentUser.following.includes(req.params.userId)) {
      currentUser.following.push(req.params.userId);
    }
    if (!targetUser.followers.includes(req.user.userId)) {
      targetUser.followers.push(req.user.userId);
    }

    await currentUser.save();
    await targetUser.save();

    console.log("✅ Follow successful. Creating notification...");

    // Create follow notification
    await createNotification("follow", req.user.userId, req.params.userId);

    console.log("✅ Follow response:", {
      following: true,
      followerCount: targetUser.followers.length,
    });

    res.json({
      following: true,
      followerCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error("❌ Follow error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unfollow user
router.delete("/:userId/follow", auth, async (req, res) => {
  try {
    console.log("🔍 Unfollow request:", {
      currentUserId: req.user.userId,
      targetUserId: req.params.userId,
    });

    const targetUser = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.userId);

    if (!targetUser || !currentUser) {
      console.log("❌ User not found:", {
        targetUser: !!targetUser,
        currentUser: !!currentUser,
      });
      return res.status(404).json({ message: "User not found" });
    }

    if (req.params.userId === req.user.userId) {
      console.log("❌ Cannot unfollow yourself");
      return res.status(400).json({ message: "Cannot unfollow yourself" });
    }

    const isFollowing = currentUser.following.includes(req.params.userId);
    console.log("🔍 Currently following:", isFollowing);

    if (!isFollowing) {
      console.log("❌ Not following this user");
      return res.status(400).json({ message: "Not following this user" });
    }

    // Unfollow
    currentUser.following.pull(req.params.userId);
    targetUser.followers.pull(req.user.userId);

    await currentUser.save();
    await targetUser.save();

    // If the target user is private, clean up any accepted follow request records
    // This allows the user to send a fresh follow request later
    if (targetUser.isPrivate) {
      await FollowRequest.findOneAndDelete({
        fromUser: req.user.userId,
        toUser: req.params.userId,
        status: "accepted",
      });
      console.log("✅ Cleaned up accepted follow request for private user");
    }

    // Clean up related notifications when unfollowing
    const Notification = require("../models/Notification");

    // Remove follow back suggestions (both directions)
    await Notification.deleteMany({
      type: "follow_back_suggestion",
      $or: [
        { fromUser: req.user.userId, toUser: req.params.userId },
        { fromUser: req.params.userId, toUser: req.user.userId },
      ],
    });

    // Remove follow request accepted notifications
    await Notification.deleteMany({
      type: "follow_request_accepted",
      $or: [
        { fromUser: req.user.userId, toUser: req.params.userId },
        { fromUser: req.params.userId, toUser: req.user.userId },
      ],
    });

    console.log("✅ Cleaned up follow-related notifications");

    console.log("✅ Unfollow successful:", {
      following: false,
      followerCount: targetUser.followers.length,
    });

    res.json({
      following: false,
      followerCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error("❌ Unfollow error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel follow request
router.delete("/:userId/follow-request", auth, async (req, res) => {
  try {
    console.log("🔍 Cancel follow request:", {
      currentUserId: req.user.userId,
      targetUserId: req.params.userId,
    });

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find and remove the follow request
    const followRequest = await FollowRequest.findOneAndDelete({
      fromUser: req.user.userId,
      toUser: req.params.userId,
      status: "pending",
    });

    if (!followRequest) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    // Remove the follow request notification
    await Notification.findOneAndDelete({
      type: "follow_request",
      fromUser: req.user.userId,
      toUser: req.params.userId,
    });

    console.log("✅ Follow request cancelled successfully");

    res.json({
      message: "Follow request cancelled",
      requested: false,
    });
  } catch (error) {
    console.error("❌ Cancel follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get followers
router.get("/:userId/followers", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "username fullName profilePicture isVerified")
      .select("followers");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.followers);
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get following
router.get("/:userId/following", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("following", "username fullName profilePicture isVerified")
      .select("following");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.following);
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check follow status
router.get("/:userId/follow-status", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const isFollowing = currentUser.following.includes(req.params.userId);

    res.json({ following: isFollowing });
  } catch (error) {
    console.error("Get follow status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search users
router.get("/search/:query", auth, async (req, res) => {
  try {
    const query = req.params.query;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
    })
      .select("username fullName profilePicture isVerified")
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user suggestions
router.get("/suggestions/for-you", auth, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
    const currentUser = await User.findById(currentUserId);

    // Use aggregation pipeline to prioritize users with profile pictures
    const suggestions = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: currentUserId, // Ensure ObjectId comparison
            $nin: currentUser.following,
          },
        },
      },
      {
        $addFields: {
          hasProfilePicture: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$profilePicture", null] },
                  { $ne: ["$profilePicture", ""] },
                  {
                    $ne: [
                      "$profilePicture",
                      "https://res.cloudinary.com/dvvzjj5fn/image/upload/v1729000000/uploads/default-avatar.png",
                    ],
                  },
                ],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
      {
        $sort: {
          hasProfilePicture: -1, // Users with profile pictures first
          followerCount: -1, // Then by follower count
          createdAt: -1, // Then by newest
        },
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          profilePicture: 1,
          isVerified: 1,
          followerCount: 1,
          hasProfilePicture: 1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    // Debug logging
    console.log("Current user ID:", currentUserId);
    console.log("Suggestions count:", suggestions.length);
    console.log(
      "Suggestions usernames:",
      suggestions.map((s) => s.username)
    );

    // Double-check: filter out current user on the server side as backup
    const filteredSuggestions = suggestions.filter(
      (suggestion) => suggestion._id.toString() !== currentUserId.toString()
    );

    console.log("Filtered suggestions count:", filteredSuggestions.length);

    res.json(filteredSuggestions);
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (for "See All" functionality)
router.get("/discover/all", auth, async (req, res) => {
  try {
    console.log("Getting all users for user:", req.user.userId);

    // Simple approach: get users excluding current user
    const allUsers = await User.find({
      _id: { $ne: req.user.userId },
    })
      .select("username fullName profilePicture isVerified followerCount")
      .sort({ followerCount: -1 })
      .limit(50); // Limit to prevent too much data

    console.log("Found users:", allUsers.length);
    res.json(allUsers);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update privacy setting
router.put("/privacy", auth, async (req, res) => {
  try {
    const { isPrivate } = req.body;

    if (typeof isPrivate !== "boolean") {
      return res.status(400).json({ message: "isPrivate must be a boolean" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isPrivate = isPrivate;
    await user.save();

    res.json({ isPrivate: user.isPrivate });
  } catch (error) {
    console.error("Update privacy error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove follower
router.delete("/:followerId/follower", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const followerUser = await User.findById(req.params.followerId);

    if (!currentUser || !followerUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the follower is actually following the current user
    if (!currentUser.followers.includes(req.params.followerId)) {
      return res.status(400).json({ message: "User is not following you" });
    }

    // Remove from both sides
    currentUser.followers.pull(req.params.followerId);
    followerUser.following.pull(req.user.userId);

    await currentUser.save();
    await followerUser.save();

    res.json({ message: "Follower removed successfully" });
  } catch (error) {
    console.error("Remove follower error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send follow request (for private accounts)
router.post("/:userId/follow-request", auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.userId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.params.userId === req.user.userId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Check if follow request already exists
    const existingRequest = await FollowRequest.findOne({
      fromUser: req.user.userId,
      toUser: req.params.userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Follow request already sent" });
    }

    // If account is public, follow directly
    if (!targetUser.isPrivate) {
      currentUser.following.push(req.params.userId);
      targetUser.followers.push(req.user.userId);

      await currentUser.save();
      await targetUser.save();

      // Create follow notification
      await createNotification("follow", req.user.userId, req.params.userId);

      return res.json({
        following: true,
        followerCount: targetUser.followers.length,
      });
    }

    // Create follow request for private account
    const followRequest = new FollowRequest({
      fromUser: req.user.userId,
      toUser: req.params.userId,
    });

    await followRequest.save();

    // Create follow request notification
    await createNotification(
      "follow_request",
      req.user.userId,
      req.params.userId
    );

    res.json({
      message: "Follow request sent",
      requested: true,
    });
  } catch (error) {
    console.error("Send follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get follow requests
router.get("/follow-requests", auth, async (req, res) => {
  try {
    console.log("📩 Follow requests endpoint hit by user:", req.user.userId);
    const followRequests = await FollowRequest.find({
      toUser: req.user.userId,
      status: "pending",
    })
      .populate("fromUser", "username fullName profilePicture isVerified")
      .sort({ createdAt: -1 });

    console.log("📩 Found follow requests:", followRequests.length);
    res.json(followRequests);
  } catch (error) {
    console.error("Get follow requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if follow request was sent to a specific user
router.get("/:userId/follow-request-status", auth, async (req, res) => {
  try {
    const existingRequest = await FollowRequest.findOne({
      fromUser: req.user.userId,
      toUser: req.params.userId,
      status: "pending",
    });

    res.json({ requestSent: !!existingRequest });
  } catch (error) {
    console.error("Check follow request status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel follow request
router.delete("/:userId/follow-request", auth, async (req, res) => {
  try {
    const followRequest = await FollowRequest.findOneAndDelete({
      fromUser: req.user.userId,
      toUser: req.params.userId,
      status: "pending",
    });

    if (!followRequest) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    // Also remove the follow_request notification
    await Notification.findOneAndDelete({
      type: "follow_request",
      fromUser: req.user.userId,
      toUser: req.params.userId,
    });

    res.json({ message: "Follow request cancelled" });
  } catch (error) {
    console.error("Cancel follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Test endpoint to verify routes are loaded
router.get("/test-privacy-routes", (req, res) => {
  res.json({
    message: "Privacy routes are loaded!",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "GET /users/follow-requests",
      "PUT /users/privacy",
      "DELETE /users/:followerId/follower",
      "POST /users/:userId/follow-request",
      "PUT /users/follow-requests/:requestId/accept",
      "PUT /users/follow-requests/:requestId/decline",
    ],
  });
});

// Accept follow request
router.put("/follow-requests/:requestId/accept", auth, async (req, res) => {
  try {
    const followRequest = await FollowRequest.findById(req.params.requestId);

    if (!followRequest) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    if (followRequest.toUser.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (followRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Follow request already processed" });
    }

    // Update follow relationship
    const currentUser = await User.findById(req.user.userId);
    const followerUser = await User.findById(followRequest.fromUser);

    if (!currentUser || !followerUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.followers.push(followRequest.fromUser);
    followerUser.following.push(req.user.userId);

    await currentUser.save();
    await followerUser.save();

    // Update request status
    followRequest.status = "accepted";
    await followRequest.save();

    // Create follow notification
    await createNotification("follow", followRequest.fromUser, req.user.userId);

    res.json({ message: "Follow request accepted" });
  } catch (error) {
    console.error("Accept follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Decline follow request
router.put("/follow-requests/:requestId/decline", auth, async (req, res) => {
  try {
    const followRequest = await FollowRequest.findById(req.params.requestId);

    if (!followRequest) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    if (followRequest.toUser.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (followRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Follow request already processed" });
    }

    // Update request status
    followRequest.status = "declined";
    await followRequest.save();

    res.json({ message: "Follow request declined" });
  } catch (error) {
    console.error("Decline follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
