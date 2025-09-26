const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      maxlength: 2200,
    },
    media: [
      {
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
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
          maxlength: 500,
        },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    location: {
      name: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    hashtags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
    commentsDisabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments ? this.comments.length : 0;
});

postSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Post", postSchema);
