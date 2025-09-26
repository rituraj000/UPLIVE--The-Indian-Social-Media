const express = require("express");
const Notification = require("../models/Notification");
const User = require("../models/User");
const FollowRequest = require("../models/FollowRequest");
const auth = require("../middleware/auth");

const router = express.Router();

// Get user's notifications (excluding message notifications)
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      toUser: req.user.userId,
      type: { $ne: "message" }, // Exclude message notifications
    })
      .populate("fromUser", "username fullName profilePicture isVerified")
      .populate("toUser", "username fullName profilePicture")
      .populate("post", "media caption")
      .populate("messageRef", "content createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read
router.put("/:notificationId/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        toUser: req.user.userId,
      },
      { isRead: true },
      { new: true }
    ).populate("fromUser", "username fullName profilePicture isVerified");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all notifications as read
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { toUser: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get unread notification count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      toUser: req.user.userId,
      isRead: false,
      type: { $ne: "message" }, // Exclude message notifications from heart icon count
    });

    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve follow request from notification
router.post("/:notificationId/approve-follow", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      toUser: req.user.userId,
      type: "follow_request",
    }).populate("fromUser", "username profilePicture");

    if (!notification) {
      return res
        .status(404)
        .json({ message: "Follow request notification not found" });
    }

    const fromUserId = notification.fromUser._id;

    // Find and update the follow request
    const followRequest = await FollowRequest.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: req.user.userId,
        status: "pending",
      },
      { status: "accepted" },
      { new: true }
    );

    if (!followRequest) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    // Add users to each other's following/followers arrays
    await User.findByIdAndUpdate(fromUserId, {
      $addToSet: { following: req.user.userId },
    });

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { followers: fromUserId },
    });

    // Remove the follow request notification (don't just mark as read)
    await Notification.findByIdAndDelete(req.params.notificationId);

    // Create a "follow_request_accepted" notification for the original requester
    await createNotification(
      "follow_request_accepted",
      req.user.userId,
      fromUserId
    );

    // Create a "follow_back" suggestion notification for the private user (only if not already exists)
    const existingFollowBack = await Notification.findOne({
      type: "follow_back_suggestion",
      fromUser: fromUserId,
      toUser: req.user.userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Within 7 days
    });

    if (!existingFollowBack) {
      await createNotification(
        "follow_back_suggestion",
        fromUserId,
        req.user.userId
      );
    }

    res.json({
      message: "Follow request approved",
      follower: notification.fromUser,
    });
  } catch (error) {
    console.error("Approve follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Decline follow request from notification
router.post("/:notificationId/decline-follow", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      toUser: req.user.userId,
      type: "follow_request",
    });

    if (!notification) {
      return res
        .status(404)
        .json({ message: "Follow request notification not found" });
    }

    const fromUserId = notification.fromUser;

    // Update the follow request status
    await FollowRequest.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: req.user.userId,
        status: "pending",
      },
      { status: "declined" }
    );

    // Delete the notification (no notification to requester when declined)
    await Notification.findByIdAndDelete(req.params.notificationId);

    res.json({ message: "Follow request declined" });
  } catch (error) {
    console.error("Decline follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Follow user back from notification (for approved follow requests)
router.post("/:notificationId/follow-back", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      toUser: req.user.userId,
      type: "follow",
    }).populate("fromUser", "username profilePicture isPrivate");

    if (!notification) {
      return res.status(404).json({ message: "Follow notification not found" });
    }

    const targetUser = notification.fromUser;
    const targetUserId = targetUser._id;

    // Check if already following
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    if (targetUser.isPrivate) {
      // For private accounts, send follow request
      const existingRequest = await FollowRequest.findOne({
        fromUser: req.user.userId,
        toUser: targetUserId,
        status: "pending",
      });

      if (existingRequest) {
        return res.status(400).json({ message: "Follow request already sent" });
      }

      // Also check for recent follow request notifications to prevent spam
      const recentFollowRequestNotification = await Notification.findOne({
        type: "follow_request",
        fromUser: req.user.userId,
        toUser: targetUserId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Within 7 days
      });

      if (recentFollowRequestNotification) {
        return res
          .status(400)
          .json({ message: "Follow request was already sent recently" });
      }

      const followRequest = new FollowRequest({
        fromUser: req.user.userId,
        toUser: targetUserId,
        status: "pending",
      });

      await followRequest.save();

      // Create follow request notification
      await createNotification("follow_request", req.user.userId, targetUserId);

      res.json({ message: "Follow request sent", requestSent: true });
    } else {
      // For public accounts, follow immediately
      await User.findByIdAndUpdate(req.user.userId, {
        $addToSet: { following: targetUserId },
      });

      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: req.user.userId },
      });

      // Create follow notification
      await createNotification("follow", req.user.userId, targetUserId);

      res.json({ message: "Successfully followed user", following: true });
    }
  } catch (error) {
    console.error("Follow back error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to create notification
const createNotification = async (
  type,
  fromUserId,
  toUserId,
  postId = null,
  message = null,
  messageId = null
) => {
  try {
    console.log("createNotification called with:", {
      type,
      fromUserId,
      toUserId,
      postId,
      message,
      messageId,
    });

    // Don't create notification for self-actions
    if (fromUserId === toUserId) {
      console.log("Skipping notification: same user");
      return;
    }

    // For message notifications, always create (don't prevent duplicates)
    if (type !== "message") {
      // Enhanced spam prevention for follow requests
      if (type === "follow_request") {
        // Check if there's already a pending follow request notification from the same user
        const existingFollowRequest = await Notification.findOne({
          type: "follow_request",
          fromUser: fromUserId,
          toUser: toUserId,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Within 7 days
        });

        if (existingFollowRequest) {
          console.log(
            "Skipping notification: recent follow request already exists"
          );
          return;
        }
      } else {
        // Check if similar notification already exists (prevent spam)
        const existingNotification = await Notification.findOne({
          type,
          fromUser: fromUserId,
          toUser: toUserId,
          post: postId,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within 24 hours
        });

        if (existingNotification) {
          console.log(
            "Skipping notification: similar notification already exists"
          );
          return existingNotification;
        }
      }
    }

    const notificationData = {
      type,
      fromUser: fromUserId,
      toUser: toUserId,
      message,
    };

    // Add post reference if provided
    if (postId) {
      notificationData.post = postId;
    }

    // Add message reference if provided
    if (messageId) {
      notificationData.messageRef = messageId;
    }

    const notification = new Notification(notificationData);
    await notification.save();

    console.log("Notification saved successfully:", notification);
    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

module.exports = router;
module.exports.createNotification = createNotification;
