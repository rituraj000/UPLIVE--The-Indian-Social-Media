const crypto = require("crypto");
const PhoneVerification = require("../models/PhoneVerification");
const axios = require("axios");
const SMSRateLimiter = require("../utils/smsRateLimiter");
const PhoneNumberValidator = require("../utils/phoneNumberValidator");

class PhoneVerificationService {
  constructor() {
    // Initialize SMS providers inside constructor
    this.initializeSMSProviders();
  }

  initializeSMSProviders() {
    // Initialize Twilio
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require("twilio");
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log("✅ Twilio client initialized");
    }

    // MSG91 configuration
    this.MSG91_API_KEY = process.env.MSG91_API_KEY;
    this.MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;
    this.MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

    // AWS SNS configuration
    this.sns = null;
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const AWS = require("aws-sdk");
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || "us-east-1",
      });
      this.sns = new AWS.SNS();
    }
  }
  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Create phone verification
  async createVerification(userId, phoneNumber, ipAddress, userAgent) {
    try {
      console.log("Creating phone verification:", { userId, phoneNumber });

      // Validate phone number format
      if (!PhoneNumberValidator.isValid(phoneNumber)) {
        throw new Error(
          "Invalid phone number format. Please enter a valid phone number."
        );
      }

      // Check rate limits
      await SMSRateLimiter.canSendSMS(phoneNumber, "phone");
      await SMSRateLimiter.checkIPLimit(ipAddress);

      // Check if any SMS provider is available
      const hasProvider =
        this.twilioClient ||
        this.MSG91_API_KEY ||
        this.sns ||
        process.env.NODE_ENV === "development";
      if (!hasProvider) {
        throw new Error(
          "SMS service temporarily unavailable. Please contact support."
        );
      }

      // Delete any existing verification for this user/phone
      const deletedCount = await PhoneVerification.deleteMany({
        $or: [{ userId }, { phoneNumber }],
      });

      if (deletedCount.deletedCount > 0) {
        console.log(
          `Deleted ${deletedCount.deletedCount} existing verifications`
        );
      }

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
      try {
        await this.sendOTP(phoneNumber, otp);
        console.log("OTP sent successfully via SMS");

        // Record successful attempt
        await SMSRateLimiter.recordAttempt(phoneNumber, "phone", true);
        await SMSRateLimiter.recordAttempt(ipAddress, "ip", true);
      } catch (smsError) {
        // Delete the verification record if SMS fails
        await PhoneVerification.deleteOne({ _id: verification._id });
        console.error(
          "SMS sending failed, verification record deleted:",
          smsError
        );

        // Record failed attempt
        await SMSRateLimiter.recordAttempt(phoneNumber, "phone", false);
        await SMSRateLimiter.recordAttempt(ipAddress, "ip", false);

        throw smsError;
      }

      console.log("Phone verification created successfully:", {
        userId,
        phoneNumber,
      });
      return verification;
    } catch (error) {
      console.error("Error creating phone verification:", error);

      // Provide more specific error messages based on error type
      if (error.message.includes("Invalid phone number format")) {
        throw new Error(
          "Please enter a valid phone number with country code (e.g., +91XXXXXXXXXX)."
        );
      } else if (error.message.includes("Too many")) {
        throw error; // Pass through rate limit errors as-is
      } else if (
        error.message.includes("SMS service temporarily unavailable")
      ) {
        throw error; // Pass through provider error
      } else if (error.message.includes("Network")) {
        throw new Error(
          "Network connection error. Please check your internet and try again."
        );
      } else if (
        error.message.includes("not verified") ||
        error.message.includes("unverified")
      ) {
        throw new Error(
          "This phone number is not verified with our SMS provider. Please contact support."
        );
      } else if (error.message.includes("MSG91 only supports")) {
        throw new Error(
          "This service currently only supports Indian phone numbers (+91)."
        );
      } else {
        throw new Error(
          "Unable to send OTP at this time. Please try again in a few minutes or contact support."
        );
      }
    }
  }

  // Send OTP via SMS (supports multiple providers)
  async sendOTP(phoneNumber, otp) {
    try {
      console.log(`📱 Sending SMS OTP to ${phoneNumber}: ${otp}`);

      // Format phone number (ensure it starts with country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log(`Formatted phone number: ${formattedPhone}`);

      const message = `Your UPLIVE verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

      let result = null;
      let lastError = null;
      let attemptedProviders = [];

      // Try Twilio first
      if (this.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
          attemptedProviders.push("Twilio");
          console.log("Attempting SMS via Twilio...");
          result = await this.sendViaTwilio(formattedPhone, message);
          console.log("✅ SMS sent via Twilio:", result);
          return result;
        } catch (error) {
          lastError = error;
          console.error("❌ Twilio SMS failed:", {
            error: error.message,
            code: error.code,
            status: error.status,
          });
        }
      }

      // Try MSG91 (Indian SMS provider)
      if (this.MSG91_API_KEY && this.MSG91_SENDER_ID) {
        try {
          attemptedProviders.push("MSG91");
          console.log("Attempting SMS via MSG91...");
          result = await this.sendViaMSG91(formattedPhone, otp);
          console.log("✅ SMS sent via MSG91:", result);
          return result;
        } catch (error) {
          lastError = error;
          console.error("❌ MSG91 SMS failed:", {
            error: error.message,
            response: error.response?.data,
          });
        }
      }

      // Try AWS SNS
      if (this.sns) {
        try {
          attemptedProviders.push("AWS SNS");
          console.log("Attempting SMS via AWS SNS...");
          result = await this.sendViaAWSSNS(formattedPhone, message);
          console.log("✅ SMS sent via AWS SNS:", result);
          return result;
        } catch (error) {
          lastError = error;
          console.error("❌ AWS SNS SMS failed:", {
            error: error.message,
            code: error.code,
          });
        }
      }

      // If all providers fail, use mock for development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔥 DEVELOPMENT MODE - Mock SMS sent to ${phoneNumber}: ${otp}`
        );
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          phoneNumber,
          provider: "mock",
        };
      }

      // All providers failed
      console.error(
        `All SMS providers failed. Attempted: ${attemptedProviders.join(", ")}`
      );

      if (attemptedProviders.length === 0) {
        throw new Error("No SMS provider configured. Please contact support.");
      } else if (
        lastError &&
        lastError.message.includes("Invalid phone number")
      ) {
        throw new Error(
          "Invalid phone number. Please check the format and try again."
        );
      } else if (
        lastError &&
        (lastError.code === 21614 || lastError.message.includes("unverified"))
      ) {
        throw new Error(
          "Phone number not verified with SMS provider. Please contact support."
        );
      } else if (lastError && lastError.message.includes("Rate limit")) {
        throw new Error(
          "Too many SMS requests. Please wait a few minutes before trying again."
        );
      } else {
        throw new Error(
          `Failed to send SMS via all providers (${attemptedProviders.join(
            ", "
          )}). Please try again later.`
        );
      }
    } catch (error) {
      console.error("Error sending SMS OTP:", error);

      // Re-throw specific errors, wrap generic ones
      if (
        error.message.includes("No SMS provider") ||
        error.message.includes("Invalid phone number") ||
        error.message.includes("not verified") ||
        error.message.includes("Rate limit") ||
        error.message.includes("Failed to send SMS via all providers")
      ) {
        throw error;
      } else {
        throw new Error(
          "Unable to send SMS. Please try again or contact support."
        );
      }
    }
  }

  // Twilio SMS
  async sendViaTwilio(phoneNumber, message) {
    const result = await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: result.sid,
      phoneNumber,
      provider: "twilio",
    };
  }

  // MSG91 SMS (Indian provider)
  async sendViaMSG91(phoneNumber, otp) {
    const url = "https://api.msg91.com/api/v5/otp";

    // Remove + and ensure it's a valid Indian number
    const cleanNumber = phoneNumber.replace("+", "");

    if (!cleanNumber.startsWith("91") || cleanNumber.length !== 12) {
      throw new Error("MSG91 only supports Indian phone numbers (+91)");
    }

    const data = {
      template_id: this.MSG91_TEMPLATE_ID,
      mobile: cleanNumber,
      authkey: this.MSG91_API_KEY,
      otp: otp,
      sender: this.MSG91_SENDER_ID,
    };

    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });

    // Check MSG91 response
    if (response.data.type === "error") {
      throw new Error(`MSG91 Error: ${response.data.message}`);
    }

    return {
      success: true,
      messageId: response.data.request_id || response.data.message,
      phoneNumber,
      provider: "msg91",
    };
  }

  // AWS SNS SMS
  async sendViaAWSSNS(phoneNumber, message) {
    const params = {
      Message: message,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    };

    const result = await this.sns.publish(params).promise();

    return {
      success: true,
      messageId: result.MessageId,
      phoneNumber,
      provider: "aws-sns",
    };
  }

  // Format phone number to international format
  formatPhoneNumber(phoneNumber) {
    // Use the validator's formatting
    return PhoneNumberValidator.formatForProvider(phoneNumber, "international");
  }

  // Verify OTP
  async verifyOTP(phoneNumber, otp, userId = null) {
    try {
      console.log("Verifying OTP:", { phoneNumber, otp, userId });

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

      console.log("OTP verified successfully:", {
        phoneNumber,
        userId: verification.userId,
      });
      return verification;
    } catch (error) {
      console.error("Error verifying OTP:", error);

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

  // Resend OTP
  async resendOTP(phoneNumber, userId) {
    try {
      console.log("Resending OTP:", { phoneNumber, userId });

      // Find existing verification
      const existingVerification = await PhoneVerification.findOne({
        userId,
        phoneNumber,
        isUsed: false,
      });

      if (!existingVerification) {
        throw new Error("No pending verification found");
      }

      // Check if enough time has passed (prevent spam)
      const timeSinceCreated =
        Date.now() - existingVerification.createdAt.getTime();
      if (timeSinceCreated < 60000) {
        // 1 minute cooldown
        throw new Error("Please wait before requesting another OTP");
      }

      // Generate new OTP
      const newOTP = this.generateOTP();
      existingVerification.otp = newOTP;
      existingVerification.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      existingVerification.attempts = 0; // Reset attempts
      existingVerification.createdAt = new Date();

      await existingVerification.save();
      await this.sendOTP(phoneNumber, newOTP);

      console.log("OTP resent successfully:", { phoneNumber, userId });
      return existingVerification;
    } catch (error) {
      console.error("Error resending OTP:", error);
      throw error;
    }
  }

  // Clean up expired verifications (call this periodically)
  async cleanupExpired() {
    try {
      const result = await PhoneVerification.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      console.log(
        `Cleaned up ${result.deletedCount} expired phone verifications`
      );
      return result.deletedCount;
    } catch (error) {
      console.error("Error cleaning up expired verifications:", error);
      throw error;
    }
  }
}

// Export the class, not an instance, so it can be instantiated after env vars are loaded
module.exports = PhoneVerificationService;
