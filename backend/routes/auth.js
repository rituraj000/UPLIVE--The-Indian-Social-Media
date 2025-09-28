const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// ------------------------------------------------------------------
// NEW ROUTE: Check Username Availability
// ------------------------------------------------------------------
router.get("/check-username/:username", async (req, res) => {
  try {
    const username = req.params.username;
    console.log("Checking username availability for:", username);

    if (!username || username.length < 3) {
      return res.status(200).json({
        available: false,
        message: "Username must be at least 3 characters long.",
      });
    }

    // Check if a user with that username exists (case-insensitive check)
    const existingUser = await User.findOne({
      username: new RegExp(`^${username}$`, "i"),
    });

    if (existingUser) {
      console.log("Username is NOT available:", username);
      // We use 200 OK here, as the check itself was successful
      return res.json({
        available: false,
        message: "This username is taken.",
      });
    }

    console.log("Username is available:", username);
    res.json({
      available: true,
      message: "Username is available!",
    });
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({
      available: null,
      message: "Server error while checking username.",
    });
  }
});

// ------------------------------------------------------------------
// Register Route
// ------------------------------------------------------------------
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3 })
      .trim()
      .escape()
      .withMessage("Username must be at least 3 characters."),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
    body("fullName")
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Full name is required."),
  ],
  async (req, res) => {
    try {
      console.log("Registration attempt:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        // This is where your 400 error comes from.
        // It sends the specific errors array back.
        return res.status(400).json({
          message: "Validation Failed", // Added a general message
          errors: errors.array(),
        });
      }

      const { username, email, password, fullName } = req.body;

      // Check if user exists (by email or username)
      console.log("Checking if user exists...");
      const existingUser = await User.findOne({
        $or: [
          { email: new RegExp(`^${email}$`, "i") },
          { username: new RegExp(`^${username}$`, "i") },
        ],
      });

      if (existingUser) {
        console.log("User already exists:", existingUser.email);
        return res.status(400).json({
          message: "A user with this email or username already exists.",
        });
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
          hasSeenWelcome: user.hasSeenWelcome,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
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
        hasSeenWelcome: user.hasSeenWelcome,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ------------------------------------------------------------------
// NEW ROUTE: Get Current User
// ------------------------------------------------------------------
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
