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
        subject: "Verify your UPLIVE account - Action Required",
        html: this.getVerificationEmailHTML(verificationUrl),
        text: this.getVerificationEmailText(verificationUrl),
        headers: {
          "X-Correlation-ID": correlationId,
        },
        // Enhanced settings for better deliverability
        mail_settings: {
          spam_check: {
            enable: true,
            threshold: 1,
          },
        },
        tracking_settings: {
          click_tracking: {
            enable: true,
            enable_text: false,
          },
          open_tracking: {
            enable: true,
          },
          subscription_tracking: {
            enable: false,
          },
        },
        // Set priority for faster delivery
        priority: 1,
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
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f8f9fa;">
        
        <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: #2563eb; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">UPLIVE</h1>
            <p style="color: #e0e7ff; margin: 5px 0 0 0; font-size: 14px;">India's Social Media Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Verify Your Account</h2>
            
            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px;">
              Thank you for joining UPLIVE. To complete your registration and secure your account, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 30px 0 10px 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; margin: 0;">
              ${verificationUrl}
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
              This verification link will expire in 24 hours for security.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              If you didn't create an UPLIVE account, please ignore this email.
            </p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <p style="color: #374151; font-size: 13px; font-weight: 600; margin: 0;">
                UPLIVE Team
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
                Made in India with care
              </p>
            </div>
          </div>
        </div>
        
      </body>
      </html>
    `;
  }

  getVerificationEmailText(verificationUrl) {
    return `
UPLIVE - India's Social Media Platform

VERIFY YOUR ACCOUNT

Thank you for joining UPLIVE. To complete your registration and secure your account, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours for security.

If you didn't create an UPLIVE account, please ignore this email.

---
UPLIVE Team
Made in India with care

For support, contact us at support@uplive.com
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
