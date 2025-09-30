const crypto = require('crypto');
const EmailVerification = require('../models/EmailVerification');
const RateLimit = require('../models/RateLimit');
const emailQueue = require('./emailQueue');

class EmailVerificationService {
  /**
   * Generate a cryptographically secure verification token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create email verification record
   */
  async createVerification(userId, email, ipAddress = null, userAgent = null) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // Remove any existing unused tokens for this user
      await EmailVerification.deleteMany({
        user: userId,
        used: false,
      });

      // Create new verification record
      const verification = new EmailVerification({
        user: userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      });

      await verification.save();

      // Queue email sending
      await emailQueue.add('send-verification-email', {
        email,
        token: verification.token,
        userId,
        correlationId: crypto.randomUUID()
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      console.log('Email verification created:', {
        userId,
        email,
        tokenId: verification._id,
        expiresAt: verification.expiresAt
      });

      return verification;
    } catch (error) {
      console.error('Failed to create email verification:', { userId, email, error: error.message });
      throw new Error('Failed to create email verification');
    }
  }

  /**
   * Verify email token
   */
  async verifyToken(token) {
    try {
      // Find and validate token
      const verification = await EmailVerification.findOne({ token }).populate('user');
      
      if (!verification) {
        throw new Error('INVALID_TOKEN');
      }

      if (verification.used) {
        throw new Error('TOKEN_ALREADY_USED');
      }

      if (new Date() > verification.expiresAt) {
        throw new Error('TOKEN_EXPIRED');
      }

      // Mark token as used (atomic operation)
      const updatedVerification = await EmailVerification.findByIdAndUpdate(
        verification._id,
        { used: true },
        { new: true }
      );

      if (!updatedVerification) {
        throw new Error('VERIFICATION_UPDATE_FAILED');
      }

      console.log('Email verification successful:', {
        userId: verification.user._id,
        tokenId: verification._id
      });

      return {
        success: true,
        userId: verification.user._id,
        user: verification.user
      };

    } catch (error) {
      console.error('Email verification failed:', {
        token: token.substring(0, 8) + '...',
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Check if user can resend verification (rate limiting)
   */
  async canResendVerification(email, ipAddress) {
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxResends = 5;
    const windowStart = new Date(Date.now() - windowMs);

    try {
      // Check rate limit for email
      const emailLimit = await RateLimit.findOne({
        identifier: email,
        action: 'email_verification_resend',
        windowStart: { $gte: windowStart }
      });

      const emailCount = emailLimit ? emailLimit.count : 0;

      // Check rate limit for IP
      let ipCount = 0;
      if (ipAddress) {
        const ipLimit = await RateLimit.findOne({
          identifier: ipAddress,
          action: 'email_verification_resend',
          windowStart: { $gte: windowStart }
        });
        ipCount = ipLimit ? ipLimit.count : 0;
      }

      return emailCount < maxResends && ipCount < maxResends;
    } catch (error) {
      console.error('Rate limit check failed:', { email, ipAddress, error: error.message });
      return false;
    }
  }

  /**
   * Record resend attempt for rate limiting
   */
  async recordResendAttempt(email, ipAddress) {
    try {
      // Record attempt for email
      await RateLimit.findOneAndUpdate(
        { identifier: email, action: 'email_verification_resend' },
        { 
          $inc: { count: 1 },
          $setOnInsert: { windowStart: new Date() }
        },
        { upsert: true, new: true }
      );

      // Record attempt for IP if provided
      if (ipAddress) {
        await RateLimit.findOneAndUpdate(
          { identifier: ipAddress, action: 'email_verification_resend' },
          { 
            $inc: { count: 1 },
            $setOnInsert: { windowStart: new Date() }
          },
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      console.error('Failed to record resend attempt:', { email, ipAddress, error: error.message });
    }
  }

  /**
   * Clean up expired tokens (cron job)
   */
  async cleanupExpiredTokens() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const result = await EmailVerification.deleteMany({
        expiresAt: { $lt: sevenDaysAgo }
      });
      
      console.log('Cleaned up expired verification tokens:', { 
        deletedCount: result.deletedCount 
      });
      
      return result.deletedCount;
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', { error: error.message });
      throw error;
    }
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(userId) {
    try {
      const verification = await EmailVerification.findOne({
        user: userId,
        used: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      return {
        hasPendingVerification: !!verification,
        expiresAt: verification ? verification.expiresAt : null
      };
    } catch (error) {
      console.error('Failed to get verification status:', { userId, error: error.message });
      return { hasPendingVerification: false, expiresAt: null };
    }
  }
}

module.exports = new EmailVerificationService();