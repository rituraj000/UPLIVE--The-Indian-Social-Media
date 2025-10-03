/**
 * Direct email service test for production debugging
 * This will help us identify the exact email service issue
 */

const nodemailer = require("nodemailer");
require("dotenv").config();

async function testProductionEmailService() {
  console.log("🔍 Production Email Service Debug Test");
  console.log("=====================================\n");

  // Step 1: Check environment variables
  console.log("📋 Environment Variables:");
  console.log("  NODE_ENV:", process.env.NODE_ENV);
  console.log(
    "  EMAIL_USER:",
    process.env.EMAIL_USER ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "  EMAIL_PASS:",
    process.env.EMAIL_PASS
      ? `✅ Set (${process.env.EMAIL_PASS.length} chars)`
      : "❌ Missing"
  );
  console.log("  CLIENT_URL:", process.env.CLIENT_URL);
  console.log("");

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing email credentials!");
    return;
  }

  try {
    // Step 2: Test transporter creation
    console.log("🔄 Creating nodemailer transporter...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Step 3: Verify connection
    console.log("🔄 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");

    // Step 4: Send actual test email
    console.log("🔄 Sending test verification email...");
    const testResult = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "your-test-email@gmail.com", // Replace with your actual email
      subject: "✅ UPLIVE Email Service - Production Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">🎉 Email Service Working!</h2>
          <p>This email confirms that your UPLIVE email service is working correctly in production.</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <strong>Test Details:</strong><br>
            ⏰ Time: ${new Date().toISOString()}<br>
            🌍 Environment: ${process.env.NODE_ENV}<br>
            📧 From: ${process.env.EMAIL_USER}<br>
            🔗 Frontend: ${process.env.CLIENT_URL}
          </div>
          <p>If you received this email, your production email verification should work! 🚀</p>
        </div>
      `,
      text: `UPLIVE Email Service Test - Production
      
This email confirms that your email service is working correctly in production.

Test Details:
Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV}
From: ${process.env.EMAIL_USER}
Frontend: ${process.env.CLIENT_URL}

If you received this email, your production email verification should work!`,
    });

    console.log("✅ Test email sent successfully!");
    console.log("📧 Message ID:", testResult.messageId);
    console.log("📧 Response:", testResult.response);
    console.log("");
    console.log("🎯 RESULT: Email service is working correctly!");
    console.log("📱 Check your inbox for the test email.");
    console.log("");
    console.log("💡 If registration emails still fail, the issue might be:");
    console.log("   1. Email queue system not working");
    console.log("   2. Error handling in verification service");
    console.log("   3. Network issues during registration flow");
  } catch (error) {
    console.error("❌ Email service test failed!");
    console.error("🔍 Error details:", error.message);
    console.error("🔍 Error code:", error.code);

    if (error.code === "EAUTH") {
      console.log("\n🔑 Authentication Error Solutions:");
      console.log("   1. Generate a fresh Gmail App Password");
      console.log("   2. Ensure 2FA is enabled on Gmail");
      console.log("   3. Update EMAIL_PASS environment variable");
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.log("\n🌐 Network Error Solutions:");
      console.log("   1. Render might be blocking SMTP ports");
      console.log("   2. Try using a different email service (SendGrid)");
      console.log("   3. Contact Render support about SMTP restrictions");
    }
  }
}

// Run the test
testProductionEmailService().catch(console.error);
