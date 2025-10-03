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

    // Check SendGrid configuration instead of SMTP
    const sendGridKey = process.env.SENDGRID_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    const healthStatus = {
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      sendgrid_key_configured: !!sendGridKey,
      email_from_configured: !!emailFrom,
      service_type: "SendGrid",
      status: "checking...",
    };

    if (!sendGridKey) {
      healthStatus.status = "ERROR";
      healthStatus.error = "SendGrid API key not configured";
      healthStatus.fix = "Set SENDGRID_API_KEY environment variable";
      return res.status(500).json(healthStatus);
    }

    // Try to initialize SendGrid email service
    const emailService = require("../services/sendGridEmailService");

    try {
      await emailService.ensureInitialized();
      healthStatus.status = "SUCCESS";
      healthStatus.message = "SendGrid email service is properly configured";
    } catch (error) {
      healthStatus.status = "ERROR";
      healthStatus.error = error.message;

      if (error.message.includes("API key")) {
        healthStatus.fix =
          "Check SendGrid API key - generate a new one if needed";
      } else {
        healthStatus.fix =
          "Check SendGrid configuration and API key permissions";
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
