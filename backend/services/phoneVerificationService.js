const crypto = require("crypto");
const PhoneVerification = require("../models/PhoneVerification");
const axios = require("axios");

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

      // Send OTP via SMS
      await this.sendOTP(phoneNumber, otp);

      console.log("Phone verification created successfully:", {
        userId,
        phoneNumber,
      });
      return verification;
    } catch (error) {
      console.error("Error creating phone verification:", error);
      throw new Error("Failed to send OTP");
    }
  }

  // Send OTP via SMS (supports multiple providers)
  async sendOTP(phoneNumber, otp) {
    try {
      console.log(`📱 Sending SMS OTP to ${phoneNumber}: ${otp}`);

      // Format phone number (ensure it starts with country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = `Your UPLIVE verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

      let result = null;

      // Try Twilio first
      if (this.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
          result = await this.sendViaTwilio(formattedPhone, message);
          console.log("✅ SMS sent via Twilio:", result);
          return result;
        } catch (error) {
          console.error("❌ Twilio SMS failed:", error.message);
        }
      }

      // Try MSG91 (Indian SMS provider)
      if (this.MSG91_API_KEY && this.MSG91_SENDER_ID) {
        try {
          result = await this.sendViaMSG91(formattedPhone, otp);
          console.log("SMS sent via MSG91:", result);
          return result;
        } catch (error) {
          console.error("MSG91 SMS failed:", error.message);
        }
      }

      // Try AWS SNS
      if (this.sns) {
        try {
          result = await this.sendViaAWSSNS(formattedPhone, message);
          console.log("SMS sent via AWS SNS:", result);
          return result;
        } catch (error) {
          console.error("AWS SNS SMS failed:", error.message);
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

      throw new Error("No SMS provider configured");
    } catch (error) {
      console.error("Error sending SMS OTP:", error);
      throw new Error("Failed to send SMS");
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

    const data = {
      template_id: MSG91_TEMPLATE_ID,
      mobile: phoneNumber.replace("+", ""),
      authkey: MSG91_API_KEY,
      otp: otp,
      sender: MSG91_SENDER_ID,
    };

    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      messageId: response.data.request_id,
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
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, "");

    // If it starts with 91 (India) and has 12 digits, add +
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return "+" + cleaned;
    }

    // If it's 10 digits and doesn't start with country code, add +91 for India
    if (cleaned.length === 10 && !cleaned.startsWith("91")) {
      return "+91" + cleaned;
    }

    // If it already starts with +, return as is
    if (phoneNumber.startsWith("+")) {
      return phoneNumber;
    }

    // Default: add + if not present
    return "+" + cleaned;
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
