const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "follow",
        "follow_request",
        "follow_request_accepted",
        "follow_back_suggestion",
        "like",
        "comment",
        "mention",
        "message",
      ],
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: false, // Only for like, comment, mention
    },
    messageRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: false, // Only for message notifications
    },
    message: {
      type: String,
      maxlength: 300,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ toUser: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

// Virtual for id
notificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

notificationSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
