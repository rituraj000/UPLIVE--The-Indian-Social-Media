const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializationPromise = null;
  }

  async ensureInitialized() {
    if (this.initialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeTransporter();
    }

    await this.initializationPromise;
  }

  async initializeTransporter() {
    try {
      // Check if credentials are provided
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error(
          "Email credentials not provided. EMAIL_USER and EMAIL_PASS environment variables are required."
        );
      }

      // Gmail configuration with timeout settings
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        pool: true,
        maxConnections: 1,
        rateDelta: 20000,
        rateLimit: 5,
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000, // 5 seconds
        socketTimeout: 15000, // 15 seconds
      });

      // Verify connection
      await this.transporter.verify();
      console.log("Email service initialized successfully");
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize email service:", error.message);
      throw new Error(`Email service initialization failed: ${error.message}`);
    }
  }

  async sendVerificationEmail({ email, token, userId, correlationId }) {
    console.log("📧 Starting email verification send for:", email);
    await this.ensureInitialized();
    console.log("✅ Email service initialization confirmed");

    try {
      // Use environment-specific client URL
      const clientUrl =
        process.env.CLIENT_URL ||
        (process.env.NODE_ENV === "production"
          ? "https://uplive-the-indian-social-media-qlqj.vercel.app"
          : "http://localhost:3000");

      const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

      const html = this.getVerificationEmailHTML(verificationUrl);
      const text = this.getVerificationEmailText(verificationUrl);

      const mailOptions = {
        from: {
          name: "UPLIVE Team",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: "🚀 Verify your UPLIVE account - Made in India",
        html,
        text,
        headers: {
          "X-Correlation-ID": correlationId,
        },
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log("✅ Verification email sent successfully:", {
        email,
        userId,
        correlationId,
        messageId: result.messageId,
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to send verification email:", {
        email,
        userId,
        correlationId,
        error: error.message,
        errorCode: error.code,
      });
      throw error;
    }
  }

  async sendWelcomeEmail({ email, username, correlationId }) {
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.warn(
        "Email service not initialized. Skipping welcome email send:",
        error.message
      );
      return;
    }

    try {
      const html = this.getWelcomeEmailHTML(username);
      const text = this.getWelcomeEmailText(username);

      const mailOptions = {
        from: {
          name: "UPLIVE Team",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: `🇮🇳 Welcome to UPLIVE, ${username}! - India's Own Social Platform`,
        html,
        text,
        headers: {
          "X-Correlation-ID": correlationId,
        },
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log("Welcome email sent successfully:", {
        email,
        username,
        correlationId,
        messageId: result.messageId,
      });

      return result;
    } catch (error) {
      console.error("Failed to send welcome email:", {
        email,
        username,
        correlationId,
        error: error.message,
      });
      throw error;
    }
  }

  getVerificationEmailHTML(verificationUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your UPLIVE Account</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5rem;
                font-weight: bold;
                background: linear-gradient(45deg, #FF9933, #138808);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
            }
            .flag {
                height: 4px;
                background: linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%);
                border-radius: 2px;
                margin: 20px 0;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(45deg, #FF9933, #138808);
                color: white;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 14px;
                color: #666;
            }
            .india-pride {
                background: rgba(255, 153, 0, 0.1);
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #FF9933;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">UPLIVE</div>
                <div class="flag"></div>
                                <h2>🚀 Verify Your Account</h2>
            </div>

            <p>Welcome to UPLIVE - India's own social media platform!</p>
            
            <p>To complete your registration and start connecting with friends, please verify your email address by clicking the button below:</p>

            <div style="text-align: center;">
                <a href="${verificationUrl}" class="btn">Verify Email Address</a>
            </div>

            <div class="india-pride">
                <strong>🇮🇳 Made in India, for India</strong><br>
                Your data stays within our nation. Join the movement towards digital independence!
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>

            <div class="footer">
                <p>If you didn't create an account with UPLIVE, please ignore this email.</p>
                <p>Need help? Contact us at ${process.env.EMAIL_USER}</p>
                <p>🇮🇳 UPLIVE - Connecting India, Protecting India</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getVerificationEmailText(verificationUrl) {
    return `
🇮🇳 UPLIVE - Verify Your Account

Welcome to UPLIVE - India's own social media platform!

To complete your registration and start connecting with friends, please verify your email address by visiting this link:

${verificationUrl}

🇮🇳 Made in India, for India
Your data stays within our nation. Join the movement towards digital independence!

IMPORTANT: This verification link will expire in 24 hours for security reasons.

If you didn't create an account with UPLIVE, please ignore this email.

Need help? Contact us at ${process.env.EMAIL_USER}

🇮🇳 UPLIVE - Connecting India, Protecting India
    `;
  }

  getWelcomeEmailHTML(username) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to UPLIVE</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5rem;
                font-weight: bold;
                background: linear-gradient(45deg, #FF9933, #138808);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
            }
            .flag {
                height: 4px;
                background: linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%);
                border-radius: 2px;
                margin: 20px 0;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(45deg, #FF9933, #138808);
                color: white;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            .feature {
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #FF9933;
                background: rgba(255, 153, 0, 0.05);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">UPLIVE</div>
                <div class="flag"></div>
                <h2>🇮🇳 Welcome to UPLIVE, ${username}!</h2>
            </div>

            <p>Your email has been verified successfully! Welcome to India's own social media platform.</p>

            <div style="text-align: center;">
                <a href="${
                  process.env.CLIENT_URL ||
                  (process.env.NODE_ENV === "production"
                    ? "https://uplive-the-indian-social-media-qlqj.vercel.app"
                    : "http://localhost:3000")
                }" class="btn">Start Exploring UPLIVE</a>
            </div>

            <h3>What you can do on UPLIVE:</h3>
            
            <div class="feature">
                📷 <strong>Share Your Moments:</strong> Post photos and videos with your friends
            </div>
            
            <div class="feature">
                💬 <strong>Stay Connected:</strong> Message friends and family securely
            </div>
            
            <div class="feature">
                📱 <strong>Stories:</strong> Share your daily life with 24-hour stories
            </div>
            
            <div class="feature">
                🇮🇳 <strong>Made in India:</strong> Your data stays secure within our nation
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <strong>🇮🇳 Join the movement towards digital independence!</strong>
            </p>

            <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
                <p>Need help? Contact us at ${process.env.EMAIL_USER}</p>
                <p>≡ƒç«≡ƒç│ UPLIVE - Connecting India, Protecting India</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getWelcomeEmailText(username) {
    const clientUrl =
      process.env.CLIENT_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://uplive-the-indian-social-media-qlqj.vercel.app"
        : "http://localhost:3000");

    return `
≡ƒç«≡ƒç│ Welcome to UPLIVE, ${username}!

Your email has been verified successfully! Welcome to India's own social media platform.

What you can do on UPLIVE:

≡ƒô╕ Share Your Moments: Post photos and videos with your friends
≡ƒÆ¼ Stay Connected: Message friends and family securely  
≡ƒôû Stories: Share your daily life with 24-hour stories
≡ƒç«≡ƒç│ Made in India: Your data stays secure within our nation

Start exploring: ${clientUrl}

≡ƒç«≡ƒç│ Join the movement towards digital independence!

Need help? Contact us at ${process.env.EMAIL_USER}
≡ƒç«≡ƒç│ UPLIVE - Connecting India, Protecting India
    `;
  }

  async sendPasswordResetEmail({ email, token, username, correlationId }) {
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.warn(
        "Email service not initialized. Skipping password reset email:",
        error.message
      );
      return;
    }

    try {
      // Use environment-specific client URL
      const clientUrl =
        process.env.CLIENT_URL ||
        (process.env.NODE_ENV === "production"
          ? "https://uplive-the-indian-social-media-qlqj.vercel.app"
          : "http://localhost:3000");

      const resetUrl = `${clientUrl}/reset-password?token=${token}`;

      const html = this.getPasswordResetEmailHTML(username, resetUrl);
      const text = this.getPasswordResetEmailText(username, resetUrl);

      const mailOptions = {
        from: {
          name: "UPLIVE Security Team",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: "≡ƒöÆ UPLIVE Password Reset Request",
        html,
        text,
        headers: {
          "X-Correlation-ID": correlationId,
          "X-Email-Type": "password-reset",
          "X-Priority": "high",
        },
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log("Password reset email sent successfully:", {
        email,
        username,
        correlationId,
        messageId: result.messageId,
      });

      return result;
    } catch (error) {
      console.error("Failed to send password reset email:", {
        email,
        username,
        correlationId,
        error: error.message,
      });
      throw error;
    }
  }

  getPasswordResetEmailHTML(username, resetUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request - UPLIVE</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5rem;
                font-weight: bold;
                background: linear-gradient(45deg, #FF9933, #138808);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
            }
            .flag {
                height: 4px;
                background: linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%);
                border-radius: 2px;
                margin: 20px 0;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(45deg, #FF9933, #138808);
                color: white;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            .security-alert {
                background: rgba(244, 67, 54, 0.1);
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #f44336;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 14px;
                color: #666;
            }
            .timer {
                font-weight: bold;
                color: #f44336;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">UPLIVE</div>
                <div class="flag"></div>
                <h2>≡ƒöÆ Password Reset Request</h2>
            </div>

            <p>Hello${username ? ` ${username}` : ""},</p>
            
            <p>We received a request to reset your password for your UPLIVE account. If you did not make this request, please ignore this email or contact our support team immediately.</p>

            <div class="security-alert">
                <strong>ΓÜá∩╕Å Security Notice:</strong><br>
                This password reset link will expire in <span class="timer">30 minutes</span>. For your security, please reset your password immediately.
            </div>

            <p>To reset your password, click the button below:</p>

            <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset My Password</a>
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>

            <div class="footer">
                <p>This email was sent because someone requested a password reset. If this was not you, you can safely ignore this email. Your password will remain unchanged.</p>
                <p>Need help? Contact our security team at ${
                  process.env.EMAIL_USER
                }</p>
                <p>≡ƒç«≡ƒç│ UPLIVE - Securing India's Digital Connections</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getPasswordResetEmailText(username, resetUrl) {
    return `
≡ƒöÆ UPLIVE Password Reset Request

Hello${username ? ` ${username}` : ""},

We received a request to reset your password for your UPLIVE account. If you did not make this request, please ignore this email or contact our support team immediately.

ΓÜá∩╕Å SECURITY NOTICE:
This password reset link will expire in 30 MINUTES. For your security, please reset your password immediately.

To reset your password, visit:
${resetUrl}

This email was sent because someone requested a password reset. If this was not you, you can safely ignore this email. Your password will remain unchanged.

Need help? Contact our security team at ${process.env.EMAIL_USER}

≡ƒç«≡ƒç│ UPLIVE - Securing India's Digital Connections
    `;
  }

  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("Email service connection verified");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
