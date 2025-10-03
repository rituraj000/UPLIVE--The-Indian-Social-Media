/**
 * Email service health check endpoint
 * Add this to your backend routes to verify email configuration in production
 */

const express = require("express");
const router = express.Router();

// Health check endpoint for email service
router.get("/email-health", async (req, res) => {
  try {
    console.log("🔍 Email health check requested");

    // Check environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const nodeEnv = process.env.NODE_ENV;

    const healthStatus = {
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      email_user_configured: !!emailUser,
      email_pass_configured: !!emailPass,
      email_pass_length: emailPass ? emailPass.length : 0,
      status: "checking...",
    };

    if (!emailUser || !emailPass) {
      healthStatus.status = "ERROR";
      healthStatus.error = "Email credentials not configured";
      healthStatus.fix = "Set EMAIL_USER and EMAIL_PASS environment variables";
      return res.status(500).json(healthStatus);
    }

    // Try to initialize email service
    const emailService = require("../services/emailService");

    try {
      await emailService.ensureInitialized();
      healthStatus.status = "SUCCESS";
      healthStatus.message = "Email service is properly configured";
    } catch (error) {
      healthStatus.status = "ERROR";
      healthStatus.error = error.message;

      if (error.message.includes("authentication failed")) {
        healthStatus.fix =
          "Check Gmail App Password - generate a new one if needed";
      } else if (
        error.message.includes("network") ||
        error.message.includes("connection")
      ) {
        healthStatus.fix = "Check if hosting provider blocks SMTP ports";
      } else {
        healthStatus.fix = "Check email credentials and server configuration";
      }
    }

    res.json(healthStatus);
  } catch (error) {
    console.error("Email health check failed:", error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: "ERROR",
      error: "Health check failed",
      details: error.message,
    });
  }
});

module.exports = router;
