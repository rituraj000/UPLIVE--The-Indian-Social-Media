const express = require("express");
const Story = require("../models/Story");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Create story
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res
        .status(400)
        .json({ message: "Media file or text is required" });
    }

    const storyData = {
      user: req.user.userId,
    };

    if (req.file) {
      storyData.media = {
        url: req.file.path,
        type: req.file.mimetype.startsWith("image/") ? "image" : "video",
        publicId: req.file.filename,
      };
    }

    if (req.body.text) {
      storyData.text = {
        content: req.body.text,
        color: req.body.textColor || "#ffffff",
        backgroundColor: req.body.backgroundColor || "#000000",
      };
    }

    const story = new Story(storyData);
    await story.save();
    await story.populate("user", "username profilePicture");

    res.status(201).json(story);
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get stories for feed
router.get("/feed", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    // Get users whose stories should be visible in feed
    const visibleUserIds = [];

    // Always include own stories
    visibleUserIds.push(req.user.userId);

    // Include all users that current user follows
    // (If you follow someone, you should see their stories in feed regardless of privacy)
    visibleUserIds.push(...currentUser.following);

    // Get stories from visible users only
    const stories = await Story.find({
      user: { $in: visibleUserIds },
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture isPrivate")
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = {};
    stories.forEach((story) => {
      const userId = story.user._id.toString();
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: story.user,
          stories: [],
          hasUnseenStories: false,
        };
      }

      // Check if this story has been seen by current user
      const hasViewed = story.viewers.some(
        (viewer) => viewer.user.toString() === req.user.userId
      );

      if (!hasViewed && story.user._id.toString() !== req.user.userId) {
        groupedStories[userId].hasUnseenStories = true;
      }

      groupedStories[userId].stories.push(story);
    });

    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error("Get stories feed error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get specific user's stories
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    // Get the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current user can view this user's stories
    let canViewStories = false;

    if (userId === currentUserId) {
      // Own stories - always visible
      canViewStories = true;
    } else if (!targetUser.isPrivate) {
      // Public user - stories visible to ANYONE
      canViewStories = true;
    } else {
      // Private user - stories visible to accepted followers only
      canViewStories = targetUser.followers.includes(currentUserId);
    }

    if (!canViewStories) {
      return res
        .status(403)
        .json({ message: "Cannot view this user's stories" });
    }

    // Get user's active stories
    const stories = await Story.find({
      user: userId,
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture isPrivate")
      .sort({ createdAt: 1 }); // Oldest first for story viewing

    // Mark stories as viewed if not the owner
    if (userId !== currentUserId) {
      for (const story of stories) {
        const hasViewed = story.viewers.some(
          (viewer) => viewer.user.toString() === currentUserId
        );

        if (!hasViewed) {
          story.viewers.push({
            user: currentUserId,
            viewedAt: new Date(),
          });
          await story.save();
        }
      }
    }

    res.json({
      user: targetUser,
      stories: stories,
      totalCount: stories.length,
    });
  } catch (error) {
    console.error("Get user stories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single story
router.get("/:storyId", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate("user", "username profilePicture")
      .populate("viewers.user", "username profilePicture");

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Add viewer if not already viewed
    const hasViewed = story.viewers.some(
      (viewer) => viewer.user._id.toString() === req.user.userId
    );

    if (!hasViewed && story.user._id.toString() !== req.user.userId) {
      story.viewers.push({ user: req.user.userId });
      await story.save();
    }

    res.json(story);
  } catch (error) {
    console.error("Get story error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get story viewers (only for story owner)
router.get("/:storyId/viewers", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate("viewers.user", "username fullName profilePicture isVerified")
      .populate("user", "username isPrivate followers");

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Only story owner can see viewers
    if (story.user._id.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view story viewers" });
    }

    // Filter viewers based on privacy settings
    let filteredViewers = story.viewers;

    if (story.user.isPrivate) {
      // Private account: Only show viewers who are followers
      filteredViewers = story.viewers.filter((viewer) =>
        story.user.followers.includes(viewer.user._id)
      );
    }
    // For public accounts, show all viewers (no filtering needed)

    // Sort viewers by most recent first
    const viewers = filteredViewers
      .map((viewer) => ({
        user: viewer.user,
        viewedAt: viewer.viewedAt,
      }))
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

    res.json({
      viewCount: viewers.length,
      viewers: viewers,
    });
  } catch (error) {
    console.error("Get story viewers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark story as viewed
router.post("/:storyId/view", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Don't record views for own stories
    if (story.user.toString() === req.user.userId) {
      return res.json({ message: "Cannot view own story" });
    }

    // Check if already viewed
    const hasViewed = story.viewers.some(
      (viewer) => viewer.user.toString() === req.user.userId
    );

    if (!hasViewed) {
      story.viewers.push({
        user: req.user.userId,
        viewedAt: new Date(),
      });
      await story.save();
    }

    res.json({ message: "Story viewed", viewCount: story.viewers.length });
  } catch (error) {
    console.error("Mark story viewed error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete story
router.delete("/:storyId", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Story.findByIdAndDelete(req.params.storyId);
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
