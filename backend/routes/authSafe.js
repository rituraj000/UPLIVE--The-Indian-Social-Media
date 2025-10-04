const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const PhoneVerification = require("../models/PhoneVerification");

// Production-safe registration route with minimal dependencies
const router = express.Router();

// Simple phone number validation
function isValidPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return false;
  }
  const cleaned = phoneNumber.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number
function formatPhoneNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return "+" + cleaned;
  }

  if (cleaned.length === 10 && !cleaned.startsWith("91")) {
    return "+91" + cleaned;
  }

  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  return "+" + cleaned;
}

// Send SMS via Twilio (production-safe)
async function sendSMS(phoneNumber, otp) {
  try {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      throw new Error("Twilio not configured");
    }

    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const message = `Your UPLIVE verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log("✅ SMS sent successfully:", result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("❌ SMS sending failed:", error.message);

    // In development, allow mock SMS
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔥 DEVELOPMENT MODE - Mock SMS sent to ${phoneNumber}: ${otp}`
      );
      return { success: true, messageId: "mock_" + Date.now() };
    }

    throw error;
  }
}

// Safe registration route
router.post(
  "/register-safe",
  [
    body("username")
      .isLength({ min: 3 })
      .trim()
      .escape()
      .withMessage("Username must be at least 3 characters."),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address."),
    body("phoneNumber")
      .optional()
      .custom((value) => {
        if (value && !isValidPhoneNumber(value)) {
          throw new Error("Please enter a valid phone number.");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
    body("fullName")
      .notEmpty()
      .trim()
      .escape()
      .withMessage("Full name is required."),
    body().custom((value, { req }) => {
      if (!req.body.email && !req.body.phoneNumber) {
        throw new Error("Either email or phone number is required");
      }
      if (req.body.email && req.body.phoneNumber) {
        throw new Error(
          "Please provide either email or phone number, not both"
        );
      }
      return true;
    }),
  ],
  async (req, res) => {
    const correlationId = Date.now().toString();

    try {
      console.log("🚀 Safe registration attempt:", {
        correlationId,
        hasEmail: !!req.body.email,
        hasPhone: !!req.body.phoneNumber,
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("❌ Validation errors:", errors.array());
        return res.status(400).json({
          message: "Validation Failed",
          errors: errors.array(),
        });
      }

      const { username, email, phoneNumber, password, fullName } = req.body;
      const verificationMethod = email ? "email" : "phone";
      const identifier = email || phoneNumber;

      console.log("📋 Registration data:", {
        username,
        identifier,
        verificationMethod,
        correlationId,
      });

      // Check if user exists
      const existingUserQuery = {
        $or: [{ username: new RegExp(`^${username}$`, "i") }],
      };

      if (email) {
        existingUserQuery.$or.push({ email: new RegExp(`^${email}$`, "i") });
      }

      if (phoneNumber) {
        existingUserQuery.$or.push({ phoneNumber });
      }

      const existingUser = await User.findOne(existingUserQuery);

      if (existingUser) {
        const isVerified =
          verificationMethod === "email"
            ? existingUser.isEmailVerified
            : existingUser.isPhoneVerified;

        if (isVerified) {
          console.log("❌ User already exists and verified");
          return res.status(400).json({
            message: "A user with this email/phone or username already exists.",
          });
        }

        // Update existing unverified user
        console.log("♻️ Updating existing unverified user");
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        existingUser.password = hashedPassword;
        existingUser.fullName = fullName;
        existingUser.username = username;

        if (email) {
          existingUser.email = email;
          existingUser.verificationMethod = "email";
        } else {
          existingUser.phoneNumber = phoneNumber;
          existingUser.verificationMethod = "phone";
        }

        await existingUser.save();

        if (verificationMethod === "phone") {
          try {
            // Create phone verification
            await PhoneVerification.deleteMany({ userId: existingUser._id });

            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const verification = new PhoneVerification({
              userId: existingUser._id,
              phoneNumber,
              otp,
              expiresAt,
              ipAddress: req.ip,
              userAgent: req.get("User-Agent"),
            });

            await verification.save();
            console.log("📱 Phone verification record created");

            // Send SMS
            await sendSMS(phoneNumber, otp);
            console.log("✅ OTP sent successfully");

            return res.status(200).json({
              message: "OTP sent to your phone number. Please verify.",
              requiresVerification: true,
              verificationMethod: "phone",
              userId: existingUser._id.toString(),
            });
          } catch (smsError) {
            console.error("❌ SMS sending failed:", smsError.message);
            return res.status(500).json({
              message:
                "Failed to send OTP. Please try again or use email registration.",
            });
          }
        } else {
          // Email verification (simplified)
          return res.status(200).json({
            message: "Registration updated. Please verify your email.",
            requiresVerification: true,
            verificationMethod: "email",
          });
        }
      }

      // Create new user
      console.log("👤 Creating new user");
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userData = {
        username,
        password: hashedPassword,
        fullName,
        verificationMethod,
        isEmailVerified: false,
        isPhoneVerified: false,
        registrationCompleted: false,
      };

      if (email) {
        userData.email = email;
      } else {
        userData.phoneNumber = phoneNumber;
      }

      const newUser = new User(userData);
      const savedUser = await newUser.save();
      console.log("✅ New user created:", savedUser._id);

      if (verificationMethod === "phone") {
        try {
          // Create phone verification
          const otp = generateOTP();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

          const verification = new PhoneVerification({
            userId: savedUser._id,
            phoneNumber,
            otp,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          });

          await verification.save();
          console.log("📱 Phone verification record created");

          // Send SMS
          await sendSMS(phoneNumber, otp);
          console.log("✅ OTP sent successfully");

          return res.status(201).json({
            message:
              "Account created! Please verify your phone number with the OTP sent.",
            requiresVerification: true,
            verificationMethod: "phone",
            userId: savedUser._id.toString(),
          });
        } catch (smsError) {
          console.error(
            "❌ SMS sending failed, deleting user:",
            smsError.message
          );
          await User.findByIdAndDelete(savedUser._id);
          return res.status(500).json({
            message:
              "Failed to send OTP. Please try again or use email registration.",
          });
        }
      } else {
        // Email verification (simplified)
        return res.status(201).json({
          message: "Account created! Please verify your email address.",
          requiresVerification: true,
          verificationMethod: "email",
        });
      }
    } catch (error) {
      console.error("❌ Registration error:", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      return res.status(500).json({
        message: "Registration failed. Please try again.",
        correlationId,
      });
    }
  }
);

module.exports = router;
