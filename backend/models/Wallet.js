const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "transfer", "payment"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "bank_transfer", "wallet"],
      required: function () {
        return this.type === "deposit";
      },
    },
    reference: {
      type: String, // Payment gateway reference ID
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    transactions: [transactionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
walletSchema.index({ user: 1 });

module.exports = mongoose.model("Wallet", walletSchema);
