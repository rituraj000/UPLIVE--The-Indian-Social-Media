const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    },
    registrationData: {
      ip: String,
      userAgent: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    attempts: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired pending registrations
pendingRegistrationSchema.index(
  { tokenExpiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Ensure username and email are available in main User collection too
pendingRegistrationSchema.pre("save", async function (next) {
  if (this.isNew) {
    const User = mongoose.model("User");

    // Check if username or email exists in actual User collection
    const existingUser = await User.findOne({
      $or: [
        { email: new RegExp(`^${this.email}$`, "i") },
        { username: new RegExp(`^${this.username}$`, "i") },
      ],
    });

    if (existingUser && existingUser.isEmailVerified) {
      const error = new Error("Username or email already exists");
      error.code = "DUPLICATE_USER";
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema
);
