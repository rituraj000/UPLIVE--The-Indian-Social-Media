const sgMail = require("@sendgrid/mail");

class SendGridEmailService {
  constructor() {
    this.initialized = false;
    this.initializationPromise = null;
  }

  async ensureInitialized() {
    if (this.initialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeService();
    }

    await this.initializationPromise;
  }

  async initializeService() {
    try {
      console.log("🔄 Initializing SendGrid email service...");
      console.log(
        "📧 SENDGRID_API_KEY:",
        process.env.SENDGRID_API_KEY ? "Set" : "Not set"
      );
      console.log("📧 EMAIL_FROM:", process.env.EMAIL_FROM || "Using default");
      console.log("🌍 NODE_ENV:", process.env.NODE_ENV);

      // Check if API key is provided
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error("SENDGRID_API_KEY environment variable is required.");
      }

      // Set API key
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      console.log("✅ SendGrid email service initialized successfully");
      this.initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize SendGrid service:", error.message);
      throw new Error(
        `SendGrid service initialization failed: ${error.message}`
      );
    }
  }

  async sendVerificationEmail({ email, token, userId, correlationId }) {
    console.log("📧 Starting SendGrid email verification send for:", email);

    try {
      await this.ensureInitialized();
      console.log("✅ SendGrid service initialization confirmed");

      // Use environment-specific client URL
      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      const verificationUrl = `${clientUrl}/verify-email?token=${token}`;
      // Use your verified SendGrid email address
      const fromEmail = process.env.EMAIL_FROM || "noreply.uplive@gmail.com";

      console.log("🔗 Verification URL generated:", verificationUrl);

      const msg = {
        to: email,
        from: {
          email: fromEmail,
          name: "UPLIVE Team",
        },
        subject: "🇮🇳 Verify your UPLIVE account - Made in India",
        html: this.getVerificationEmailHTML(verificationUrl),
        text: this.getVerificationEmailText(verificationUrl),
        headers: {
          "X-Correlation-ID": correlationId,
        },
      };

      console.log("📤 Attempting to send email via SendGrid:", {
        to: email,
        from: fromEmail,
        subject: msg.subject,
        correlationId,
      });

      const result = await sgMail.send(msg);

      console.log("✅ Verification email sent successfully via SendGrid:", {
        email,
        userId,
        correlationId,
        messageId: result[0].headers["x-message-id"],
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to send verification email via SendGrid:", {
        email,
        userId,
        correlationId,
        error: error.message,
        errorCode: error.code,
        errorResponse: error.response?.body,
      });

      // Provide specific error messages for common SendGrid issues
      if (error.code === 401) {
        throw new Error(
          "SendGrid authentication failed. Please check SENDGRID_API_KEY."
        );
      } else if (error.code === 403) {
        throw new Error("SendGrid access denied. Check API key permissions.");
      } else {
        throw new Error(`SendGrid email send failed: ${error.message}`);
      }
    }
  }

  async sendWelcomeEmail({ email, username, correlationId }) {
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.warn(
        "SendGrid service not initialized. Skipping welcome email send:",
        error.message
      );
      return;
    }

    try {
      const fromEmail = process.env.EMAIL_FROM || "noreply.uplive@gmail.com";

      const msg = {
        to: email,
        from: {
          email: fromEmail,
          name: "UPLIVE Team",
        },
        subject: "🎉 Welcome to UPLIVE - India's Social Media Platform!",
        html: this.getWelcomeEmailHTML(username),
        text: this.getWelcomeEmailText(username),
        headers: {
          "X-Correlation-ID": correlationId,
        },
      };

      const result = await sgMail.send(msg);
      console.log("Welcome email sent via SendGrid:", {
        email,
        username,
        correlationId,
      });
      return result;
    } catch (error) {
      console.error(
        "Failed to send welcome email via SendGrid:",
        error.message
      );
      // Don't throw for welcome emails - they're not critical
    }
  }

  getVerificationEmailHTML(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your UPLIVE Account</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🇮🇳 Welcome to UPLIVE</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">India's Own Social Media Platform</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #333; margin-top: 0;">🎉 Thank you for joining UPLIVE!</h2>
          <p>We're excited to have you as part of India's growing social media community. To complete your registration and start connecting with friends, please verify your email address.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              ✅ Verify My Account
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="background: #fff; border: 2px solid #e0e0e0; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <h3 style="color: #333; margin-top: 0;">🚀 What's Next?</h3>
          <ul style="color: #666; padding-left: 20px;">
            <li>Complete your profile with a photo and bio</li>
            <li>Start following friends and interesting people</li>
            <li>Share your first post with the community</li>
            <li>Explore trending content from across India</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create an account with UPLIVE, please ignore this email.</p>
          <p style="margin-top: 20px;">
            <strong>UPLIVE Team</strong><br>
            Made with ❤️ in India 🇮🇳
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getVerificationEmailText(verificationUrl) {
    return `
🇮🇳 Welcome to UPLIVE - India's Own Social Media Platform!

Thank you for joining UPLIVE! We're excited to have you as part of India's growing social media community.

To complete your registration and start connecting with friends, please verify your email address by clicking the link below:

${verificationUrl}

What's Next?
- Complete your profile with a photo and bio
- Start following friends and interesting people
- Share your first post with the community
- Explore trending content from across India

This link will expire in 24 hours for security reasons.

If you didn't create an account with UPLIVE, please ignore this email.

UPLIVE Team
Made with ❤️ in India 🇮🇳
    `;
  }

  getWelcomeEmailHTML(username) {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1>🎉 Welcome to UPLIVE, ${username}!</h1>
          <p>You're now part of India's growing social media community!</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 10px;">
          <h2>🚀 Get Started:</h2>
          <ul>
            <li>Complete your profile</li>
            <li>Find and follow friends</li>
            <li>Share your first post</li>
            <li>Explore trending content</li>
          </ul>
          <p style="text-align: center; margin-top: 30px;">
            <strong>Made with ❤️ in India 🇮🇳</strong>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeEmailText(username) {
    return `
🎉 Welcome to UPLIVE, ${username}!

You're now part of India's growing social media community!

🚀 Get Started:
- Complete your profile
- Find and follow friends  
- Share your first post
- Explore trending content

Made with ❤️ in India 🇮🇳
    `;
  }

  async verifyConnection() {
    try {
      await this.ensureInitialized();
      return { success: true, message: "SendGrid service is ready" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SendGridEmailService();
