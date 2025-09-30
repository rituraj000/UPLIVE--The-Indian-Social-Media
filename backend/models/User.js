const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/dqvtnp7fg/image/upload/v1234567890/default-avatar.jpg",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    registrationCompleted: {
      type: Boolean,
      default: false, // Only true after email verification
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    hasSeenWelcome: {
      type: Boolean,
      default: false, // New users should see welcome page
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for follower count
userSchema.virtual("followerCount").get(function () {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual("followingCount").get(function () {
  return this.following ? this.following.length : 0;
});

// Virtual for post count
userSchema.virtual("postCount").get(function () {
  return this.posts ? this.posts.length : 0;
});

userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
