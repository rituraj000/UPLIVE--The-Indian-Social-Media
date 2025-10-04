const RateLimit = require("../models/RateLimit");

class SMSRateLimiter {
  // Check if user can send SMS (prevents spam)
  static async canSendSMS(identifier, type = "phone") {
    try {
      const now = new Date();
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Clean up old rate limit records
      await RateLimit.deleteMany({
        createdAt: { $lt: oneDay },
      });

      // Check current limits
      const recentAttempts = await RateLimit.find({
        identifier,
        type,
        createdAt: { $gte: oneHour },
      });

      // Allow max 5 SMS per hour, 10 per day
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
      throw error;
    }
  }

  // Record SMS attempt
  static async recordAttempt(identifier, type = "phone", success = true) {
    try {
      const attempt = new RateLimit({
        identifier,
        type,
        success,
        createdAt: new Date(),
      });

      await attempt.save();
      return attempt;
    } catch (error) {
      console.error("Failed to record rate limit attempt:", error);
      // Don't throw error here, as it's not critical
    }
  }

  // Check IP-based rate limiting
  static async checkIPLimit(ipAddress) {
    try {
      const now = new Date();
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000);

      const ipAttempts = await RateLimit.find({
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
      throw error;
    }
  }
}

module.exports = SMSRateLimiter;
