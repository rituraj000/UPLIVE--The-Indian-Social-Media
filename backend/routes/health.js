const express = require('express');
const mongoose = require('mongoose');
const EmailVerification = require('../models/EmailVerification');
const RateLimit = require('../models/RateLimit');
const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'uplive-email-verification',
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      health.database = 'connected';
    } else {
      health.database = 'disconnected';
      health.status = 'degraded';
    }

    // Check email verification collection
    const verificationCount = await EmailVerification.countDocuments({
      used: false,
      expiresAt: { $gt: new Date() }
    });
    health.activeVerifications = verificationCount;

  } catch (error) {
    health.database = 'error';
    health.status = 'unhealthy';
    health.error = error.message;
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness check endpoint
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Test database query
    await EmailVerification.findOne().limit(1);

    res.json({ 
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple metrics endpoint (without prometheus dependency)
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      memory_usage: process.memoryUsage(),
      active_verifications: await EmailVerification.countDocuments({
        used: false,
        expiresAt: { $gt: new Date() }
      }),
      expired_verifications: await EmailVerification.countDocuments({
        expiresAt: { $lt: new Date() }
      }),
      used_verifications: await EmailVerification.countDocuments({
        used: true
      }),
      rate_limit_records: await RateLimit.countDocuments(),
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;