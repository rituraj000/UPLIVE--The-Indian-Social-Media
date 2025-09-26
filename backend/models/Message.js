const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      text: String,
      media: {
        url: String,
        type: {
          type: String,
          enum: ["image", "video"],
        },
        publicId: String,
      },
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    deletedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        deletedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for id
messageSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Transform for JSON response
messageSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Message", messageSchema);
