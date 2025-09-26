const express = require("express");
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { createNotification } = require("./notification");
const mongoose = require("mongoose");

const router = express.Router();

// Get conversations
router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          "deletedBy.user": { $ne: userId },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          user: {
            id: "$user._id",
            _id: "$user._id",
            username: "$user.username",
            fullName: "$user.fullName",
            profilePicture: "$user.profilePicture",
          },
          lastMessage: "$lastMessage",
          unreadCount: "$unreadCount",
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get total unread message count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false,
      "deletedBy.user": { $ne: userId },
    });

    res.json({ count: unreadCount });
  } catch (error) {
    console.error("Get unread message count error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages between users
router.get("/:userId", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
    const otherUserId = new mongoose.Types.ObjectId(req.params.userId);

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
      "deletedBy.user": { $ne: currentUserId },
    })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate({
        path: "content.post",
        populate: {
          path: "user",
          select: "username profilePicture fullName isVerified",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user.userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get conversation status (last seen info)
router.get("/:userId/status", auth, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
    const otherUserId = new mongoose.Types.ObjectId(req.params.userId);

    // Get the last message sent by current user to other user
    const lastSentMessage = await Message.findOne({
      sender: currentUserId,
      receiver: otherUserId,
      "deletedBy.user": { $ne: currentUserId },
    })
      .sort({ createdAt: -1 })
      .select("isRead readAt createdAt");

    // Get when other user was last seen (last message they read)
    const lastSeenMessage = await Message.findOne({
      sender: currentUserId,
      receiver: otherUserId,
      isRead: true,
      readAt: { $exists: true },
      "deletedBy.user": { $ne: currentUserId },
    })
      .sort({ readAt: -1 })
      .select("readAt");

    res.json({
      lastSentMessage,
      lastSeenAt: lastSeenMessage?.readAt || null,
      hasUnreadMessages: lastSentMessage && !lastSentMessage.isRead,
    });
  } catch (error) {
    console.error("Get conversation status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send message
router.post(
  "/:userId",
  auth,
  upload.single("media"),
  [body("text").optional().trim()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { text, postId } = req.body;

      if (!text && !req.file && !postId) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const messageData = {
        sender: req.user.userId,
        receiver: req.params.userId,
        content: {},
      };

      if (text) {
        messageData.content.text = text;
      }

      if (req.file) {
        messageData.content.media = {
          url: req.file.path,
          type: req.file.mimetype.startsWith("image/") ? "image" : "video",
          publicId: req.file.filename,
        };
      }

      if (postId) {
        messageData.content.post = postId;
      }

      const message = new Message(messageData);
      await message.save();

      await message.populate([
        { path: "sender", select: "username profilePicture" },
        { path: "receiver", select: "username profilePicture" },
        {
          path: "content.post",
          populate: {
            path: "user",
            select: "username profilePicture fullName isVerified",
          },
        },
      ]);

      // Create message notification
      try {
        const messageContent =
          text ||
          (req.file
            ? req.file.mimetype.startsWith("image/")
              ? "📷 Photo"
              : "🎥 Video"
            : postId
            ? "📝 Shared a post"
            : "New message");

        console.log("Creating message notification:", {
          type: "message",
          fromUser: req.user.userId,
          toUser: req.params.userId,
          messageContent,
          messageId: message._id,
        });

        const notification = await createNotification(
          "message",
          req.user.userId,
          req.params.userId,
          null,
          messageContent,
          message._id
        );

        console.log(
          "Message notification created:",
          notification ? "Success" : "Failed"
        );
      } catch (error) {
        console.error("Failed to create message notification:", error);
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete message (soft delete - hide from user)
router.delete("/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is sender or receiver
    if (
      message.sender.toString() !== req.user.userId &&
      message.receiver.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Add user to deletedBy array (soft delete)
    const existingDeletion = message.deletedBy.find(
      (del) => del.user.toString() === req.user.userId
    );
    if (!existingDeletion) {
      message.deletedBy.push({ user: req.user.userId });
      await message.save();
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete entire conversation with a user
router.delete("/conversation/:userId", auth, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
    const otherUserId = new mongoose.Types.ObjectId(req.params.userId);

    // Validate that otherUserId is a valid user
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    });

    // Add current user to deletedBy array for all messages in the conversation
    const bulkOperations = messages.map((message) => ({
      updateOne: {
        filter: { _id: message._id },
        update: {
          $addToSet: { deletedBy: { user: currentUserId } },
        },
      },
    }));

    if (bulkOperations.length > 0) {
      await Message.bulkWrite(bulkOperations);
    }

    res.json({
      message: "Conversation deleted successfully",
      deletedCount: messages.length,
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
