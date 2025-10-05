const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Specific routes must come before parameterized routes
router.get("/suggestions/for-you", auth, async (req, res) => {
  res.json([]);
});

router.get("/follow-requests", auth, async (req, res) => {
  res.json([]);
});

router.get("/:username", auth, async (req, res) => {
  res.json({
    _id: "demo",
    username: req.params.username,
    fullName: req.params.username,
    following: [],
    followers: [],
    posts: [],
  });
});

module.exports = router;
