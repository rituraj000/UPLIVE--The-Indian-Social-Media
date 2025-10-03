const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const auth = require("../middleware/auth");
const emailVerificationService = require("../services/emailVerificationService");
const emailQueue = require("../services/emailQueue");
const emailService = require("../services/emailService");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

// Rate limiter for email verification resends
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.body.email || req.ip,
  message: {
    error: "Too many resend attempts, please wait before requesting again.",
  },
});

// Rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  keyGenerator: (req) => req.body.email || req.ip,
  message: {
    error: "Too many password reset attempts, please try again later.",
  },
});

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
// Register Route with Email Verification
// ------------------------------------------------------------------
router.post(
  "/register",
  authLimiter,
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
    const correlationId = req.headers["x-correlation-id"] || uuidv4();

    try {
      console.log("Registration attempt:", {
        email: req.body.email,
        username: req.body.username,
        correlationId,
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation Failed",
          errors: errors.array(),
        });
      }

      const { username, email, password, fullName } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [
          { email: new RegExp(`^${email}$`, "i") },
          { username: new RegExp(`^${username}$`, "i") },
        ],
      });

      if (existingUser) {
        // If user exists but email not verified, allow re-registration
        if (!existingUser.isEmailVerified) {
          console.log("Re-registering unverified user:", {
            userId: existingUser._id,
            email,
            correlationId,
          });

          // Update existing user
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(password, salt);

          existingUser.password = hashedPassword;
          existingUser.fullName = fullName;
          existingUser.username = username;
          await existingUser.save();

          // Create new verification token
          await emailVerificationService.createVerification(
            existingUser._id.toString(),
            email,
            req.ip,
            req.get("User-Agent")
          );

          return res.status(200).json({
            message: "Verification email sent. Please check your inbox.",
            requiresVerification: true,
          });
        } else {
          return res.status(400).json({
            message: "A user with this email or username already exists.",
          });
        }
      }

      // Create new user (BUT DON'T SAVE YET)
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userData = {
        username,
        email,
        password: hashedPassword,
        fullName,
        isEmailVerified: false,
        registrationCompleted: false,
      };

      // FIRST: Try to create email verification to ensure email service works
      try {
        // Create a temporary user to get an ID for email verification
        const tempUser = new User(userData);
        const savedUser = await tempUser.save();

        console.log("User created, attempting email verification:", {
          userId: savedUser._id,
          email,
          correlationId,
        });

        // Create email verification - this will throw if email fails
        const verification = await emailVerificationService.createVerification(
          savedUser._id.toString(),
          email,
          req.ip,
          req.get("User-Agent")
        );

        // Verify that email was actually sent
        if (!verification) {
          // If verification creation failed, delete the user and throw error
          await User.findByIdAndDelete(savedUser._id);
          throw new Error("Failed to send verification email");
        }

        res.status(201).json({
          message:
            "Account created! Please check your email to verify your account.",
          requiresVerification: true,
        });
      } catch (emailError) {
        console.error("Email verification failed during registration:", {
          email,
          correlationId,
          error: emailError.message,
        });

        // Clean up: try to delete user if it was created
        try {
          await User.findOneAndDelete({ email: email });
        } catch (cleanupError) {
          console.error(
            "Failed to cleanup user after email failure:",
            cleanupError.message
          );
        }

        return res.status(500).json({
          message:
            "Registration failed: Unable to send verification email. Please try again later.",
          error: "EMAIL_SEND_FAILED",
        });
      }
    } catch (error) {
      console.error("Register error:", {
        email: req.body.email,
        correlationId,
        error: error.message,
      });
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// ------------------------------------------------------------------
// Verify Email Route
// ------------------------------------------------------------------
router.post(
  "/verify-email",
  [body("token").isLength({ min: 32 }).withMessage("Invalid token format")],
  async (req, res) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Invalid token format",
          errors: errors.array(),
        });
      }

      const { token } = req.body;

      console.log("Email verification attempt:", {
        token: token.substring(0, 8) + "...",
        correlationId,
      });

      // Verify token
      const verification = await emailVerificationService.verifyToken(token);

      if (!verification.success) {
        return res.status(400).json({
          message: "Invalid or expired verification token",
        });
      }

      // Update user as verified
      const user = await User.findByIdAndUpdate(
        verification.userId,
        {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          registrationCompleted: true,
        },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      // Send welcome email
      await emailQueue.add("send-welcome-email", {
        email: user.email,
        username: user.username,
        correlationId,
      });

      console.log("Email verification completed:", {
        userId: user._id,
        email: user.email,
        correlationId,
      });

      res.json({
        message: "Email verified successfully! Welcome to UPLIVE!",
        token: jwtToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          hasSeenWelcome: user.hasSeenWelcome,
        },
      });
    } catch (error) {
      console.error("Email verification error:", {
        correlationId,
        error: error.message,
      });

      let message = "Verification failed";
      let statusCode = 400;

      switch (error.message) {
        case "INVALID_TOKEN":
          message = "Invalid verification token";
          break;
        case "TOKEN_ALREADY_USED":
          message = "This verification link has already been used";
          break;
        case "TOKEN_EXPIRED":
          message = "Verification link has expired. Please request a new one.";
          break;
        default:
          message = "Server error during verification";
          statusCode = 500;
      }

      res.status(statusCode).json({ message });
    }
  }
);

// ------------------------------------------------------------------
// Resend Verification Email Route
// ------------------------------------------------------------------
router.post(
  "/resend-verification",
  resendLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  async (req, res) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Invalid email format",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      console.log("Resend verification attempt:", { email, correlationId });

      // Check rate limiting
      const canResend = await emailVerificationService.canResendVerification(
        email,
        req.ip
      );

      if (!canResend) {
        return res.status(429).json({
          message:
            "Too many resend attempts. Please wait before requesting again.",
        });
      }

      // Always return success to prevent email enumeration
      // But only send email if user exists and is not verified
      const user = await User.findOne({
        email: new RegExp(`^${email}$`, "i"),
      });

      if (user && !user.isEmailVerified) {
        await emailVerificationService.createVerification(
          user._id.toString(),
          email,
          req.ip,
          req.get("User-Agent")
        );

        console.log("Verification email resent:", {
          userId: user._id,
          email,
          correlationId,
        });
      } else {
        console.log("Resend attempt for non-existent or verified user:", {
          email,
          correlationId,
        });
      }

      // Record the attempt for rate limiting
      await emailVerificationService.recordResendAttempt(email, req.ip);

      // Always return the same message
      res.json({
        message:
          "If an unverified account with this email exists, a verification email has been sent.",
      });
    } catch (error) {
      console.error("Resend verification error:", {
        email: req.body.email,
        correlationId,
        error: error.message,
      });

      res.status(500).json({
        message: "Server error. Please try again later.",
      });
    }
  }
);

// ------------------------------------------------------------------
// Login Route (Updated to check email verification)
// ------------------------------------------------------------------
router.post("/login", authLimiter, async (req, res) => {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();

  try {
    const { email, password } = req.body;

    console.log("Login attempt:", { email, correlationId });

    // Find user by email
    const user = await User.findOne({
      email: new RegExp(`^${email}$`, "i"),
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        requiresVerification: true,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    console.log("Login successful:", {
      userId: user._id,
      email,
      correlationId,
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        hasSeenWelcome: user.hasSeenWelcome,
      },
    });
  } catch (error) {
    console.error("Login error:", {
      email: req.body.email,
      correlationId,
      error: error.message,
    });

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ------------------------------------------------------------------
// NEW ROUTE: Get Current User
// ------------------------------------------------------------------
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate({
        path: "savedPosts",
        select: "id _id",
      });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------------------------------------------------
// FORGOT PASSWORD Route
// ------------------------------------------------------------------
router.post(
  "/forgot-password",
  passwordResetLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  async (req, res) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Invalid email format",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      console.log("Password reset request:", { email, correlationId });

      // Find user by email
      const user = await User.findOne({
        email: new RegExp(`^${email}$`, "i"),
      });

      // To prevent email enumeration, always return a success message
      // But only send the email if the user exists and is verified
      if (!user || !user.isEmailVerified) {
        console.log(
          "Password reset requested for non-existent or unverified user:",
          {
            email,
            correlationId,
          }
        );

        // Return 200 to prevent email enumeration attacks
        return res.status(200).json({
          message:
            "If your account exists and is verified, you will receive an email with password reset instructions.",
        });
      }

      // Check if there's a recent reset token still valid
      const existingToken = await PasswordReset.findOne({
        user: user._id,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (existingToken) {
        // If there's a token less than 5 minutes old, don't create a new one
        const tokenAgeMinutes = Math.round(
          (Date.now() - existingToken.createdAt) / (1000 * 60)
        );

        if (tokenAgeMinutes < 5) {
          console.log("Reusing recent password reset token:", {
            userId: user._id,
            email,
            tokenAge: `${tokenAgeMinutes} minutes`,
            correlationId,
          });

          // Send email with existing token
          await emailService.sendPasswordResetEmail({
            email: user.email,
            token: existingToken.token,
            username: user.username,
            correlationId,
          });

          return res.json({
            message:
              "If your account exists and is verified, you will receive an email with password reset instructions.",
          });
        }

        // If token exists but is older than 5 minutes, invalidate it
        existingToken.used = true;
        await existingToken.save();
      }

      // Generate token
      const token = PasswordReset.generateToken();

      // Create reset token in DB
      const passwordReset = new PasswordReset({
        user: user._id,
        token,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      await passwordReset.save();

      console.log("Password reset token created:", {
        userId: user._id,
        email,
        correlationId,
      });

      // Send email with reset instructions using queue
      await emailQueue.add("send-password-reset-email", {
        email: user.email,
        token,
        username: user.username,
        correlationId,
      });

      res.json({
        message:
          "If your account exists and is verified, you will receive an email with password reset instructions.",
      });
    } catch (error) {
      console.error("Forgot password error:", {
        email: req.body.email,
        correlationId,
        error: error.message,
      });

      // Still return success to prevent enumeration
      res.status(200).json({
        message:
          "If your account exists and is verified, you will receive an email with password reset instructions.",
      });
    }
  }
);

// ------------------------------------------------------------------
// RESET PASSWORD Route
// ------------------------------------------------------------------
router.post(
  "/reset-password",
  [
    body("token").isLength({ min: 32 }).withMessage("Invalid token format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters."),
  ],
  async (req, res) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { token, password } = req.body;

      console.log("Password reset attempt:", {
        token: token.substring(0, 8) + "...",
        correlationId,
      });

      // Find valid reset token
      const passwordReset = await PasswordReset.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!passwordReset) {
        return res.status(400).json({
          message: "Invalid or expired password reset token",
        });
      }

      // Mark token as used to prevent reuse
      passwordReset.used = true;
      await passwordReset.save();

      // Find user
      const user = await User.findById(passwordReset.user);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Update password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      console.log("Password reset completed:", {
        userId: user._id,
        email: user.email,
        correlationId,
      });

      // Create and return JWT
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.json({
        message: "Your password has been reset successfully.",
        token: jwtToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Reset password error:", {
        correlationId,
        error: error.message,
      });

      res.status(500).json({
        message:
          "An error occurred while resetting your password. Please try again.",
      });
    }
  }
);

// ------------------------------------------------------------------
// Change Password Route (for logged-in users)
// ------------------------------------------------------------------
router.post(
  "/change-password",
  auth,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  async (req, res) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      console.log("Password change attempt:", {
        userId,
        correlationId,
      });

      // Find user
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      // Verify new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);

      if (isSamePassword) {
        return res.status(400).json({
          message: "New password must be different from current password",
        });
      }

      // Update password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      console.log("Password changed successfully:", {
        userId: user._id,
        email: user.email,
        correlationId,
      });

      res.json({
        message: "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error("Change password error:", {
        userId: req.user.userId,
        correlationId,
        error: error.message,
      });

      res.status(500).json({
        message:
          "An error occurred while changing your password. Please try again.",
      });
    }
  }
);

module.exports = router;
