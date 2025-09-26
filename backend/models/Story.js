const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
      publicId: String, // for Cloudinary
    },
    text: {
      content: String,
      color: {
        type: String,
        default: "#ffffff",
      },
      backgroundColor: {
        type: String,
        default: "#000000",
      },
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic deletion
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for view count
storySchema.virtual("viewCount").get(function () {
  return this.viewers.length;
});

storySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Story", storySchema);
