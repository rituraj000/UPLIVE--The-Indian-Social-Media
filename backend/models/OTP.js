const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["email_verification", "password_reset"],
      default: "email_verification",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5, // Maximum 5 attempts
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Expires after 10 minutes (600 seconds)
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
