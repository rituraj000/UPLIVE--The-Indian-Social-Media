const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("username").isLength({ min: 3 }).trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("fullName").notEmpty().trim().escape(),
  ],
  async (req, res) => {
    try {
      console.log("Registration attempt:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, fullName } = req.body;

      // Check if user exists
      console.log("Checking if user exists...");
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        console.log("User already exists:", existingUser.email);
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      console.log("Hashing password...");
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      console.log("Creating user...");
      const user = new User({
        username,
        email,
        password: hashedPassword,
        fullName,
      });

      console.log("Saving user to database...");
      await user.save();
      console.log("User saved successfully:", user._id);

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      console.log("Registration successful for:", email);
      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          hasSeenWelcome: user.hasSeenWelcome, // Include this for new users
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Update last seen
      user.lastSeen = new Date();
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          hasSeenWelcome: user.hasSeenWelcome, // Include this for existing users
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture")
      .select("-password");

    res.json(user);
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
