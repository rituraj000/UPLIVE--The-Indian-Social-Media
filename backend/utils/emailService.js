co; // Create transporter with fallback options
const createTransporter = () => {
  // Try Gmail first
  const gmailTransporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Fallback to SMTP with different settings
  const smtpTransporter = nodemailer.createTransporter({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return smtpTransporter; // Use SMTP version for better compatibility
};
iler = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, fullName = "User") => {
  try {
    // For development: If no valid email configuration, just log the OTP
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === "your-actual-email@gmail.com" ||
      process.env.EMAIL_PASS === "your-16-digit-app-password" ||
      process.env.NODE_ENV === "development"
    ) {
      console.log("=".repeat(50));
      console.log("📧 DEVELOPMENT MODE - EMAIL OTP");
      console.log("=".repeat(50));
      console.log(`To: ${email}`);
      console.log(`Name: ${fullName}`);
      console.log(`OTP: ${otp}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log("=".repeat(50));

      return { success: true, messageId: "dev-mode-" + Date.now() };
    }

    // Production mode: Send real emails
    console.log(`📧 Sending OTP email to: ${email}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Email User: ${process.env.EMAIL_USER}`);

    const transporter = createTransporter();

    // Test connection with timeout and detailed logging
    console.log("🔍 Testing SMTP connection...");
    console.log("Email config:", {
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS?.length,
      service: "gmail",
    });

    try {
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("SMTP connection timeout"));
        }, 10000); // 10 second timeout for connection test

        transporter.verify((error, success) => {
          clearTimeout(timeoutId);
          if (error) {
            console.error("SMTP verification failed:", {
              message: error.message,
              code: error.code,
              command: error.command,
            });
            reject(error);
          } else {
            console.log("✅ SMTP connection verified successfully");
            resolve(success);
          }
        });
      });
    } catch (connectionError) {
      console.error(
        "❌ SMTP connection failed, trying alternative approach..."
      );
      // Don't fail completely, try to send anyway
    }

    const mailOptions = {
      from: {
        name: "UPLIVE - The Indian Social Media",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "🔐 Your UPLIVE Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>UPLIVE Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 2.5rem; font-family: 'Arial Black', Arial, sans-serif;">UPLIVE</h1>
              <p style="color: white; margin: 5px 0 0 0; font-size: 0.9rem; opacity: 0.9;">🇮🇳 Made in India, for India</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 1.5rem;">Hello ${fullName}! 👋</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0; font-size: 1rem;">
                Welcome to UPLIVE! To complete your registration, please verify your email address using the verification code below:
              </p>
              
              <!-- OTP Box -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 12px; padding: 25px 35px;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                  <div style="font-size: 2.2rem; font-weight: bold; color: #ff6b35; letter-spacing: 4px; font-family: 'Courier New', monospace;">${otp}</div>
                </div>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin: 25px 0; font-size: 0.95rem;">
                This code will expire in <strong>10 minutes</strong> for security reasons. If you didn't request this verification, please ignore this email.
              </p>
              
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1565c0; font-size: 0.9rem;">
                  <strong>🔐 Security Tip:</strong> Never share this code with anyone. UPLIVE will never ask for your verification code via phone or email.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 0.85rem; text-align: center;">
                Thanks for joining UPLIVE - Connect, Share, Live!
              </p>
              <p style="margin: 0; color: #999; font-size: 0.8rem; text-align: center;">
                This email was sent to ${email}. If you have any questions, contact our support team.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `,
    };

    console.log("📤 Sending email...");
    // Send email with timeout
    const result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Email sending timeout"));
      }, 15000); // 15 second timeout for sending

      transporter.sendMail(mailOptions, (error, info) => {
        clearTimeout(timeoutId);
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });

    console.log("✅ OTP email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending OTP email:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", {
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
    });

    // Return specific error messages based on error type
    if (error.message.includes("timeout")) {
      return {
        success: false,
        error: "Email service timeout. Please try again.",
      };
    } else if (error.code === "EAUTH" || error.responseCode === 535) {
      console.error("Gmail authentication failed - check App Password");
      return {
        success: false,
        error: "Email authentication failed. Please contact support.",
      };
    } else if (error.code === "ENOTFOUND") {
      return {
        success: false,
        error: "Email service unavailable. Please try again later.",
      };
    } else if (error.code === "ECONNECTION" || error.code === "ESOCKET") {
      return {
        success: false,
        error: "Network connection failed. Please try again.",
      };
    } else {
      return {
        success: false,
        error: "Failed to send verification email. Please try again.",
      };
    }
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
};
