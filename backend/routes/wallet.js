const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Get user's wallet - Demo version
router.get("/", auth, async (req, res) => {
  try {
    // Return demo wallet data
    const demoWallet = {
      _id: "demo_wallet_id",
      user: req.user.id,
      balance: 0,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.json(demoWallet);
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ message: "Server error" });
  } 
});

// Add money to wallet - Demo version of for the frontend ui
router.post("/add-money", auth, async (req, res) => {
  try {
    res.json({
      message: "This feature is coming soon!",
      status: "demo",
    });
  } catch (error) {
    console.error("Add money error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Support another user - Demo version
router.post("/support", auth, async (req, res) => {
  try {
    res.json({
      message: "Support feature is coming soon!",
      status: "demo",
    });
  } catch (error) {
    console.error("Support error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get transaction history - Demo version
router.get("/transactions", auth, async (req, res) => {
  try {
    res.json({
      transactions: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;