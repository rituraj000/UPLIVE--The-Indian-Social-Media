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
      required: function () {
        return !this.phoneNumber; // Email required only if no phone number
      },
      unique: true,
      sparse: true, // Allow null values for unique index
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: function () {
        return !this.email; // Phone required only if no email
      },
      unique: true,
      sparse: true, // Allow null values for unique index
      trim: true,
      match: /^\+?[1-9]\d{1,14}$/, // E.164 format
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
    // Phone verification fields
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    // Verification method used ('email' or 'phone')
    verificationMethod: {
      type: String,
      enum: ["email", "phone"],
      default: function () {
        return this.email ? "email" : "phone";
      },
    },
    registrationCompleted: {
      type: Boolean,
      default: false, // Only true after verification (email or phone)
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
  if (!this.followers) return 0;
  // Remove duplicates and self-follows
  const uniqueFollowers = [
    ...new Set(this.followers.map((id) => id.toString())),
  ].filter((id) => id !== this._id.toString());
  return uniqueFollowers.length;
});

// Virtual for following count
userSchema.virtual("followingCount").get(function () {
  if (!this.following) return 0;
  // Remove duplicates and self-follows
  const uniqueFollowing = [
    ...new Set(this.following.map((id) => id.toString())),
  ].filter((id) => id !== this._id.toString());
  return uniqueFollowing.length;
});

// Virtual for post count
userSchema.virtual("postCount").get(function () {
  return this.posts ? this.posts.length : 0;
});

// Virtual for verification status (email OR phone)
userSchema.virtual("isVerificationComplete").get(function () {
  return (
    (this.verificationMethod === "email" && this.isEmailVerified) ||
    (this.verificationMethod === "phone" && this.isPhoneVerified)
  );
});

userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
