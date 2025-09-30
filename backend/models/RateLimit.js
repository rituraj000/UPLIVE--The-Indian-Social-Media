const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["email_verification_resend", "login_attempt", "registration_attempt"],
    },
    count: {
      type: Number,
      default: 0,
    },
    windowStart: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      },
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate rate limit records
rateLimitSchema.index({ identifier: 1, action: 1 }, { unique: true });

module.exports = mongoose.model("RateLimit", rateLimitSchema);