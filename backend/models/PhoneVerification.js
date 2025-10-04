const mongoose = require("mongoose");

const phoneVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\+?[1-9]\d{1,14}$/, // E.164 format
  },
  otp: {
    type: String,
    required: true,
    length: 6,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // Automatically delete expired documents
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
});

// Compound index for efficient queries
phoneVerificationSchema.index({ userId: 1, phoneNumber: 1 });
phoneVerificationSchema.index({ phoneNumber: 1, otp: 1 });

module.exports = mongoose.model("PhoneVerification", phoneVerificationSchema);
