/**
 * Test script to check email configuration in production
 * Run this script on your production server to debug email issues
 */

const nodemailer = require("nodemailer");
require("dotenv").config();

async function testEmailConfiguration() {
  console.log("🔍 Testing Email Configuration...\n");

  // Check environment variables
  console.log("📧 Environment Variables:");
  console.log(
    "  EMAIL_USER:",
    process.env.EMAIL_USER ? "✅ Set" : "❌ Not set"
  );
  console.log(
    "  EMAIL_PASS:",
    process.env.EMAIL_PASS
      ? "✅ Set (length: " + process.env.EMAIL_PASS.length + ")"
      : "❌ Not set"
  );
  console.log("  NODE_ENV:", process.env.NODE_ENV);
  console.log("  CLIENT_URL:", process.env.CLIENT_URL);
  console.log("");

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing email credentials in environment variables");
    console.log("\n📝 To fix this:");
    console.log("1. Add EMAIL_USER and EMAIL_PASS to your deployment platform");
    console.log(
      "2. Make sure you're using a Gmail App Password, not regular password"
    );
    console.log("3. Redeploy your application");
    return;
  }

  try {
    console.log("🔄 Creating email transporter...");
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("🔄 Verifying email connection...");
    await transporter.verify();
    console.log("✅ Email connection successful!");

    // Test sending an actual email
    console.log("🔄 Sending test email...");
    const testResult = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: "UPLIVE Email Service Test",
      text: "This is a test email from your UPLIVE application. If you receive this, email service is working correctly!",
      html: `
        <h2>UPLIVE Email Service Test</h2>
        <p>This is a test email from your UPLIVE application.</p>
        <p>If you receive this, email service is working correctly!</p>
        <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log("📧 Message ID:", testResult.messageId);
    console.log("\n🎉 Email service is working correctly!");
    console.log("📱 Check your inbox (and spam folder) for the test email.");
  } catch (error) {
    console.error("❌ Email service test failed:", error.message);

    if (error.code === "EAUTH") {
      console.log("\n🔑 Authentication Error - Possible fixes:");
      console.log(
        "1. Make sure you're using a Gmail App Password, not your regular password"
      );
      console.log("2. Enable 2-Factor Authentication on your Gmail account");
      console.log(
        "3. Generate a new App Password from Google Account Settings"
      );
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.log("\n🌐 Network Error - Possible fixes:");
      console.log("1. Check if your hosting provider blocks SMTP ports");
      console.log("2. Try using a different email service (SendGrid, Mailgun)");
      console.log("3. Check firewall settings");
    } else {
      console.log("\n🔧 General debugging steps:");
      console.log("1. Double-check your EMAIL_USER and EMAIL_PASS values");
      console.log("2. Try generating a fresh Gmail App Password");
      console.log("3. Check deployment logs for more details");
    }
  }
}

// Run the test
testEmailConfiguration().catch(console.error);
