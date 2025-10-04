const SMSRateLimit = require("../models/SMSRateLimit");

class SMSRateLimiter {
  // Check if user can send SMS (prevents spam)
  static async canSendSMS(identifier, type = "phone") {
    try {
      const now = new Date();
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000);

      // Check current limits within the last hour
      const recentAttempts = await SMSRateLimit.find({
        identifier,
        type,
        createdAt: { $gte: oneHour },
      });

      // Allow max 5 SMS per hour
      if (recentAttempts.length >= 5) {
        const oldestAttempt = recentAttempts.sort(
          (a, b) => a.createdAt - b.createdAt
        )[0];
        const timeUntilReset = new Date(
          oldestAttempt.createdAt.getTime() + 60 * 60 * 1000
        );
        const minutesLeft = Math.ceil((timeUntilReset - now) / (60 * 1000));

        throw new Error(
          `Too many SMS requests. Please wait ${minutesLeft} minutes before trying again.`
        );
      }

      return true;
    } catch (error) {
      console.error("Rate limiting check failed:", error);

      // In production, if rate limiting fails, allow the operation but log the error
      if (process.env.NODE_ENV === "production") {
        console.error(
          "Rate limiting failed in production, allowing operation:",
          error.message
        );
        return true;
      }

      throw error;
    }
  }

  // Record SMS attempt
  static async recordAttempt(identifier, type = "phone", success = true) {
    try {
      const attempt = new SMSRateLimit({
        identifier,
        type,
        success,
        createdAt: new Date(),
      });

      await attempt.save();
      return attempt;
    } catch (error) {
      console.error("Failed to record rate limit attempt:", error);
      // Don't throw error here, as it's not critical for the main operation
    }
  }

  // Check IP-based rate limiting
  static async checkIPLimit(ipAddress) {
    try {
      const now = new Date();
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000);

      const ipAttempts = await SMSRateLimit.find({
        identifier: ipAddress,
        type: "ip",
        createdAt: { $gte: oneHour },
      });

      // Allow max 20 SMS per IP per hour
      if (ipAttempts.length >= 20) {
        throw new Error(
          "Too many requests from this IP address. Please try again later."
        );
      }

      return true;
    } catch (error) {
      console.error("IP rate limiting check failed:", error);

      // In production, if rate limiting fails, allow the operation but log the error
      if (process.env.NODE_ENV === "production") {
        console.error(
          "IP rate limiting failed in production, allowing operation:",
          error.message
        );
        return true;
      }

      throw error;
    }
  }
}

module.exports = SMSRateLimiter;
