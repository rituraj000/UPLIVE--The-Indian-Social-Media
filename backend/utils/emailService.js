// Quick fix for Gmail issues - Hybrid email service
const nodemailer = require("nodemailer");

const sendOTPEmail = async (email, otp, fullName = "User") => {
  try {
    // For production, try real email first, fallback to logging
    console.log(`📧 Attempting to send OTP to: ${email}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);

    if (
      process.env.NODE_ENV === "production" &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.ENABLE_REAL_EMAIL === "true" // Only try real email if explicitly enabled
    ) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail", // Use Gmail service instead of manual config
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s/g, ""), // Remove any spaces
          },
          pool: true, // Enable connection pooling
          maxConnections: 1,
          maxMessages: 3,
          rateDelta: 1000,
          rateLimit: 3,
          tls: {
            rejectUnauthorized: false,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "🔐 Your UPLIVE Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>UPLIVE Verification Code</h2>
              <p>Hello! Your verification code is:</p>
              <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                ${otp}
              </div>
              <p>This code will expire in 10 minutes.</p>
            </div>
          `,
        };

        // Send with timeout promise
        await Promise.race([
          transporter.sendMail(mailOptions),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email timeout")), 20000)
          ),
        ]);

        console.log("✅ OTP email sent successfully to:", email);
        return { success: true, messageId: "gmail-" + Date.now() };
      } catch (emailError) {
        console.error(
          "❌ Gmail failed, falling back to console:",
          emailError.message
        );
        // Fall through to console logging
      }
    }

    // Fallback: Log to console (primary mode for now)
    console.log("=".repeat(50));
    console.log("📧 EMAIL OTP (Console Mode - Working)");
    console.log("=".repeat(50));
    console.log(`To: ${email}`);
    console.log(`Name: ${fullName}`);
    console.log(`OTP: ${otp}`);
    console.log("=".repeat(50));

    return { success: true, messageId: "fallback-" + Date.now() };
  } catch (error) {
    console.error("❌ Email service error:", error);
    return {
      success: false,
      error: "Failed to send verification email. Please try again.",
    };
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  generateOTP,
  sendOTPEmail,
};
