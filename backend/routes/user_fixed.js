const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/:username", auth, async (req, res) => {
  try {
    const username = req.params.username;
    const demoUser = {
      _id: "demo_user_id",
      username: username,
      fullName: username,
      email: username + "@demo.com",
      profilePicture: "",
      bio: "Demo profile",
      isVerified: false,
      followers: [],
      following: [],
      posts: [],
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      isOwnProfile: true,
      isFollowing: false,
    };
    res.json(demoUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/follow-requests", auth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
