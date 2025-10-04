const mongoose = require("mongoose");

const smsRateLimitSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["phone", "ip"],
      default: "phone",
    },
    success: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours (auto-delete)
    },
  },
  {
    timestamps: false, // We're using custom createdAt
  }
);

// Index for efficient querying
smsRateLimitSchema.index({ identifier: 1, type: 1, createdAt: 1 });

module.exports = mongoose.model("SMSRateLimit", smsRateLimitSchema);
