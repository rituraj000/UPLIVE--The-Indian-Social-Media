const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Production health check for registration system
router.get("/registration-health", async (req, res) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: "OK",
    environment: process.env.NODE_ENV,
    checks: {},
  };

  try {
    // Database connection check
    healthCheck.checks.database = {
      status:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name,
    };

    // Environment variables check
    healthCheck.checks.environment = {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasEmailConfig: !!(process.env.EMAIL_FROM && process.env.EMAIL_PASS),
    };

    // Model loading check
    try {
      const User = require("../models/User");
      const PhoneVerification = require("../models/PhoneVerification");
      const SMSRateLimit = require("../models/SMSRateLimit");

      healthCheck.checks.models = {
        User: "loaded",
        PhoneVerification: "loaded",
        SMSRateLimit: "loaded",
      };
    } catch (modelError) {
      healthCheck.checks.models = {
        error: modelError.message,
      };
    }

    // Service loading check
    try {
      const PhoneVerificationService = require("../services/phoneVerificationService");
      const SimplePhoneVerificationService = require("../services/simplePhoneVerificationService");

      // Try to initialize services
      let mainServiceStatus = "failed";
      let fallbackServiceStatus = "failed";

      try {
        const mainService = new PhoneVerificationService();
        mainServiceStatus = "loaded";
      } catch (error) {
        mainServiceStatus = `failed: ${error.message}`;
      }

      try {
        const fallbackService = new SimplePhoneVerificationService();
        fallbackServiceStatus = "loaded";
      } catch (error) {
        fallbackServiceStatus = `failed: ${error.message}`;
      }

      healthCheck.checks.services = {
        PhoneVerificationService: mainServiceStatus,
        SimplePhoneVerificationService: fallbackServiceStatus,
      };
    } catch (serviceError) {
      healthCheck.checks.services = {
        error: serviceError.message,
      };
    }

    // Twilio connectivity check (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require("twilio");
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        // Try to fetch account info (lightweight check)
        const account = await client.api
          .accounts(process.env.TWILIO_ACCOUNT_SID)
          .fetch();
        healthCheck.checks.twilio = {
          status: "connected",
          accountStatus: account.status,
          accountType: account.type,
        };
      } catch (twilioError) {
        healthCheck.checks.twilio = {
          status: "failed",
          error: twilioError.message,
        };
      }
    } else {
      healthCheck.checks.twilio = {
        status: "not_configured",
      };
    }

    // Overall health assessment
    const failures = [];

    if (healthCheck.checks.database.status !== "connected") {
      failures.push("database");
    }

    if (
      !healthCheck.checks.environment.hasMongoUri ||
      !healthCheck.checks.environment.hasJwtSecret
    ) {
      failures.push("critical_environment_variables");
    }

    if (healthCheck.checks.models.error) {
      failures.push("models");
    }

    if (
      healthCheck.checks.services.PhoneVerificationService.includes("failed") &&
      healthCheck.checks.services.SimplePhoneVerificationService.includes(
        "failed"
      )
    ) {
      failures.push("phone_services");
    }

    if (failures.length > 0) {
      healthCheck.status = "DEGRADED";
      healthCheck.failures = failures;
      return res.status(503).json(healthCheck);
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = "ERROR";
    healthCheck.error = error.message;
    res.status(500).json(healthCheck);
  }
});

// Test registration endpoint (for debugging)
router.post("/test-registration", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number required for test" });
    }

    // Test phone number formatting
    const PhoneNumberValidator = require("../utils/phoneNumberValidator");
    const isValid = PhoneNumberValidator.isValid(phoneNumber);
    const formatted = PhoneNumberValidator.formatForProvider(phoneNumber);

    // Test service initialization
    let serviceStatus = {};

    try {
      const PhoneVerificationService = require("../services/phoneVerificationService");
      const service = new PhoneVerificationService();
      serviceStatus.main = "initialized";
    } catch (error) {
      serviceStatus.main = `failed: ${error.message}`;
    }

    try {
      const SimplePhoneVerificationService = require("../services/simplePhoneVerificationService");
      const service = new SimplePhoneVerificationService();
      serviceStatus.fallback = "initialized";
    } catch (error) {
      serviceStatus.fallback = `failed: ${error.message}`;
    }

    res.json({
      phoneValidation: {
        original: phoneNumber,
        isValid,
        formatted,
      },
      serviceStatus,
      twilioConfigured: !!(
        process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
