const express = require("express");
const { body, validationResult } = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { createNotification } = require("./notification");

const router = express.Router();

// Test endpoint (no auth required) - for debugging
router.get("/test", async (req, res) => {
  try {
    const postCount = await Post.countDocuments();
    res.json({
      message: "API is working!",
      postCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts (public feed) - only from public accounts or accounts user follows
router.get("/all", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    // Get users whose posts should be visible
    const visibleUserIds = [];

    // Always include own posts
    visibleUserIds.push(req.user.userId);

    // Get all users and check privacy settings
    const allUsers = await User.find().select("_id isPrivate followers");

    for (const user of allUsers) {
      if (user._id.toString() === req.user.userId) continue; // Skip own posts (already added)

      // If user is public, or if user is private and current user is in their followers
      if (!user.isPrivate || user.followers.includes(req.user.userId)) {
        visibleUserIds.push(user._id);
      }
    }

    const posts = await Post.find({
      user: { $in: visibleUserIds },
      isArchived: false,
    })
      .populate("user", "username fullName profilePicture isVerified isPrivate")
      .populate("likes", "username")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create post
router.post(
  "/",
  auth,
  upload.array("media", 10),
  [body("caption").optional().isLength({ max: 2200 }).trim()],
  async (req, res) => {
    try {
      console.log("🔍 POST /posts route hit");
      console.log("📁 Files received:", req.files ? req.files.length : 0);
      console.log("📝 Body:", req.body);
      console.log("🔐 User:", req.user?.userId);

      if (req.files) {
        req.files.forEach((file, index) => {
          console.log(`📷 File ${index}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
          });
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.files || req.files.length === 0) {
        console.log("❌ No files received in request");
        return res
          .status(400)
          .json({ message: "At least one media file is required" });
      }

      const { caption, location, tags, hashtags } = req.body;

      // Process media files
      const media = req.files.map((file) => ({
        url: file.path,
        type: file.mimetype.startsWith("image/") ? "image" : "video",
        publicId: file.filename,
      }));

      // Process hashtags
      const processedHashtags = hashtags
        ? hashtags.split(",").map((tag) => tag.trim().replace("#", ""))
        : [];

      const post = new Post({
        user: req.user.userId,
        caption,
        media,
        location: location ? JSON.parse(location) : undefined,
        tags: tags ? JSON.parse(tags) : [],
        hashtags: processedHashtags,
      });

      await post.save();
      await post.populate("user", "username profilePicture isVerified");

      // Add post to user's posts array
      await User.findByIdAndUpdate(req.user.userId, {
        $push: { posts: post._id },
      });

      console.log("Post created successfully:", {
        postId: post._id,
        userId: req.user.userId,
        mediaCount: media.length,
        caption: caption ? caption.substring(0, 50) + "..." : "No caption",
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get feed posts
router.get("/feed", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.userId);

    // Get users whose posts should be visible in feed
    const visibleUserIds = [];

    // Always include own posts
    visibleUserIds.push(req.user.userId);

    // Check each followed user for privacy settings
    for (const followedUserId of currentUser.following) {
      const followedUser = await User.findById(followedUserId);
      if (followedUser) {
        // If user is public, or if user is private and current user is in their followers
        if (
          !followedUser.isPrivate ||
          followedUser.followers.includes(req.user.userId)
        ) {
          visibleUserIds.push(followedUserId);
        }
      }
    }

    const posts = await Post.find({
      user: { $in: visibleUserIds },
      isArchived: false,
    })
      .populate("user", "username profilePicture isVerified isPrivate")
      .populate("likes", "username")
      .populate("comments.user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(posts);
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get saved posts - MUST come before /:postId route
router.get("/saved", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user with populated saved posts
    const user = await User.findById(userId).populate({
      path: "savedPosts",
      populate: {
        path: "user",
        select: "username fullName profilePicture isVerified",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out any null posts (in case some saved posts were deleted)
    const savedPosts = user.savedPosts.filter((post) => post !== null);

    res.json(savedPosts);
  } catch (error) {
    console.error("Get saved posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single post
router.get("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("user", "username profilePicture isVerified")
      .populate("likes", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Like/Unlike post
router.post("/:postId/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "user",
      "isPrivate followers"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check privacy permissions for liking
    const postOwner = post.user;
    const currentUserId = req.user.userId;

    if (postOwner._id.toString() !== currentUserId) {
      // If post owner has private account, only followers can like
      if (postOwner.isPrivate && !postOwner.followers.includes(currentUserId)) {
        return res.status(403).json({
          message: "You can only like posts from accounts you follow",
        });
      }
    }

    const isLiked = post.likes.includes(req.user.userId);

    if (isLiked) {
      post.likes.pull(req.user.userId);
    } else {
      post.likes.push(req.user.userId);

      // Create like notification for post owner
      if (post.user._id.toString() !== req.user.userId) {
        await createNotification(
          "like",
          req.user.userId,
          post.user._id,
          req.params.postId
        );
      }
    }

    await post.save();

    res.json({
      liked: !isLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add comment
router.post(
  "/:postId/comments",
  auth,
  [body("text").notEmpty().isLength({ max: 500 }).trim().escape()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await Post.findById(req.params.postId).populate(
        "user",
        "username isPrivate followers"
      );

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.commentsDisabled) {
        return res
          .status(403)
          .json({ message: "Comments are disabled for this post" });
      }

      // Check privacy permissions for commenting
      const postOwner = post.user;
      const currentUserId = req.user.userId;

      if (postOwner._id.toString() !== currentUserId) {
        // If post owner has private account, only followers can comment
        if (
          postOwner.isPrivate &&
          !postOwner.followers.includes(currentUserId)
        ) {
          return res.status(403).json({
            message: "You can only comment on posts from accounts you follow",
          });
        }
      }

      const newComment = {
        user: req.user.userId,
        text: req.body.text,
      };

      post.comments.push(newComment);
      await post.save();

      // Create comment notification for post owner (if not commenting on own post)
      if (post.user._id.toString() !== req.user.userId) {
        await createNotification(
          "comment",
          req.user.userId,
          post.user._id,
          req.params.postId
        );
      }

      await post.populate("comments.user", "username profilePicture");

      const addedComment = post.comments[post.comments.length - 1];
      res.status(201).json(addedComment);
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get comments for a post
router.get("/:postId/comments", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("user", "username isPrivate followers")
      .populate("comments.user", "username profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check privacy permissions for viewing comments
    const postOwner = post.user;
    const currentUserId = req.user.userId;

    if (postOwner._id.toString() !== currentUserId) {
      // If post owner has private account, only followers can see comments
      if (postOwner.isPrivate && !postOwner.followers.includes(currentUserId)) {
        return res.status(403).json({
          message:
            "You can only view comments on posts from accounts you follow",
        });
      }
    }

    // Filter comments based on privacy settings
    let visibleComments = post.comments;

    if (postOwner.isPrivate) {
      // Private account: Only show comments from followers
      visibleComments = post.comments.filter(
        (comment) =>
          comment.user._id.toString() === currentUserId || // Always show own comments
          postOwner.followers.includes(comment.user._id)
      );
    }
    // For public accounts, show all comments

    // Sort comments by creation date (newest first)
    visibleComments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      comments: visibleComments,
      commentCount: visibleComments.length,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit post
router.put("/:postId", auth, async (req, res) => {
  try {
    const { caption } = req.body;

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update the post
    post.caption = caption;
    await post.save();

    // Populate user data for response
    await post.populate("user", "username profilePicture isVerified");

    console.log("Post updated successfully:", {
      postId: post._id,
      userId: req.user.userId,
      newCaption: caption ? caption.substring(0, 50) + "..." : "No caption",
    });

    res.json(post);
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete post
router.delete("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Post.findByIdAndDelete(req.params.postId);

    // Remove from user's posts array
    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { posts: req.params.postId },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get explore posts
router.get("/explore/posts", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.userId);

    // Get public users only for explore
    const publicUsers = await User.find({
      isPrivate: false,
      _id: { $nin: [...currentUser.following, req.user.userId] },
    }).select("_id");

    const publicUserIds = publicUsers.map((user) => user._id);

    const posts = await Post.find({
      user: { $in: publicUserIds },
      isArchived: false,
    })
      .populate("user", "username profilePicture isVerified isPrivate")
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(posts);
  } catch (error) {
    console.error("Get explore posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user posts
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current user can view this user's posts
    const canViewPosts =
      req.params.userId === req.user.userId || // Own posts
      !targetUser.isPrivate || // Public account
      targetUser.followers.includes(req.user.userId); // Private account but user is approved follower

    if (!canViewPosts) {
      return res.status(403).json({
        message: "This account is private. Follow to see their posts.",
      });
    }

    const posts = await Post.find({
      user: req.params.userId,
      isArchived: false,
    })
      .populate("user", "username profilePicture isVerified isPrivate")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Save a post
router.post("/:postId/save", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get user and check if post is already saved
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAlreadySaved = user.savedPosts.includes(postId);
    if (isAlreadySaved) {
      return res.status(400).json({ message: "Post already saved" });
    }

    // Add post to saved posts
    user.savedPosts.push(postId);
    await user.save();

    res.json({
      message: "Post saved successfully",
      saved: true,
      savedCount: user.savedPosts.length,
    });
  } catch (error) {
    console.error("Save post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unsave a post
router.delete("/:postId/save", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if post is saved
    const isPostSaved = user.savedPosts.includes(postId);
    if (!isPostSaved) {
      return res.status(400).json({ message: "Post not saved" });
    }

    // Remove post from saved posts
    user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId);
    await user.save();

    res.json({
      message: "Post unsaved successfully",
      saved: false,
      savedCount: user.savedPosts.length,
    });
  } catch (error) {
    console.error("Unsave post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
