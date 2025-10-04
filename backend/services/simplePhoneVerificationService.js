const crypto = require("crypto");
const PhoneVerification = require("../models/PhoneVerification");
const axios = require("axios");

// Production-safe phone verification service without external dependencies
class SimplePhoneVerificationService {
  constructor() {
    this.initializeSMSProviders();
  }

  initializeSMSProviders() {
    // Initialize Twilio
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require("twilio");
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        console.log("✅ Twilio client initialized");
      } catch (error) {
        console.error("❌ Twilio initialization failed:", error.message);
      }
    }

    // MSG91 configuration
    this.MSG91_API_KEY = process.env.MSG91_API_KEY;
    this.MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;
    this.MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

    // AWS SNS configuration
    this.sns = null;
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const AWS = require("aws-sdk");
        AWS.config.update({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || "us-east-1",
        });
        this.sns = new AWS.SNS();
        console.log("✅ AWS SNS initialized");
      } catch (error) {
        console.error("❌ AWS SNS initialization failed:", error.message);
      }
    }
  }

  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Simple phone number validation
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return false;
    }
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  // Format phone number to international format
  formatPhoneNumber(phoneNumber) {
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

  // Create phone verification (production-safe)
  async createVerification(userId, phoneNumber, ipAddress, userAgent) {
    try {
      console.log("Creating phone verification:", { userId, phoneNumber });

      // Basic validation
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error(
          "Invalid phone number format. Please enter a valid phone number."
        );
      }

      // Check if any SMS provider is available
      const hasProvider =
        this.twilioClient ||
        this.MSG91_API_KEY ||
        this.sns ||
        process.env.NODE_ENV === "development";
      if (!hasProvider) {
        throw new Error(
          "SMS service temporarily unavailable. Please try again later."
        );
      }

      // Delete any existing verification for this user/phone
      await PhoneVerification.deleteMany({
        $or: [{ userId }, { phoneNumber }],
      });

      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const verification = new PhoneVerification({
        userId,
        phoneNumber,
        otp,
        expiresAt,
        ipAddress,
        userAgent,
      });

      await verification.save();
      console.log("Verification record saved to database");

      // Send OTP via SMS
      await this.sendOTP(phoneNumber, otp);
      console.log("OTP sent successfully via SMS");

      return verification;
    } catch (error) {
      console.error("Error creating phone verification:", error);
      throw new Error("Failed to send OTP. Please try again.");
    }
  }

  // Send OTP via SMS (production-safe)
  async sendOTP(phoneNumber, otp) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = `Your UPLIVE verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

      // Try Twilio first
      if (this.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
          const result = await this.twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone,
          });

          return {
            success: true,
            messageId: result.sid,
            phoneNumber: formattedPhone,
            provider: "twilio",
          };
        } catch (error) {
          console.error("Twilio SMS failed:", error.message);
        }
      }

      // Try MSG91 for Indian numbers
      if (this.MSG91_API_KEY && formattedPhone.startsWith("+91")) {
        try {
          const cleanNumber = formattedPhone.replace("+", "");
          const response = await axios.post(
            "https://api.msg91.com/api/v5/otp",
            {
              template_id: this.MSG91_TEMPLATE_ID,
              mobile: cleanNumber,
              authkey: this.MSG91_API_KEY,
              otp: otp,
              sender: this.MSG91_SENDER_ID,
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );

          return {
            success: true,
            messageId: response.data.request_id || "msg91_sent",
            phoneNumber: formattedPhone,
            provider: "msg91",
          };
        } catch (error) {
          console.error("MSG91 SMS failed:", error.message);
        }
      }

      // Development mode fallback
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔥 DEVELOPMENT MODE - Mock SMS sent to ${phoneNumber}: ${otp}`
        );
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          phoneNumber: formattedPhone,
          provider: "mock",
        };
      }

      throw new Error("Unable to send SMS. Please try again later.");
    } catch (error) {
      console.error("Error sending SMS OTP:", error);
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber, otp, userId = null) {
    try {
      const query = { phoneNumber, otp, isUsed: false };
      if (userId) {
        query.userId = userId;
      }

      const verification = await PhoneVerification.findOne(query);

      if (!verification) {
        throw new Error("Invalid OTP or phone number");
      }

      if (verification.expiresAt < new Date()) {
        await PhoneVerification.deleteOne({ _id: verification._id });
        throw new Error("OTP has expired");
      }

      if (verification.attempts >= 5) {
        await PhoneVerification.deleteOne({ _id: verification._id });
        throw new Error("Too many failed attempts");
      }

      // Mark as used
      verification.isUsed = true;
      await verification.save();

      return verification;
    } catch (error) {
      // Increment attempts if verification exists
      const verification = await PhoneVerification.findOne({
        phoneNumber,
        isUsed: false,
      });

      if (verification) {
        verification.attempts += 1;
        await verification.save();
      }

      throw error;
    }
  }
}

module.exports = SimplePhoneVerificationService;
