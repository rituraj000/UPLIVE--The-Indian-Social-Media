/**
 * Direct SendGrid test for production debugging
 */
const sgMail = require("@sendgrid/mail");

async function testSendGridDirectly() {
  console.log("🧪 Testing SendGrid directly...");

  // Set API key
  const apiKey =
    "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";
  sgMail.setApiKey(apiKey);

  const msg = {
    to: "test@gmail.com", // Replace with your email
    from: "noreply.uplive@gmail.com", // Verified sender
    subject: "SendGrid Test",
    text: "This is a test email from SendGrid",
    html: "<strong>This is a test email from SendGrid</strong>",
  };

  try {
    const result = await sgMail.send(msg);
    console.log("✅ SendGrid test email sent successfully!");
    console.log("Message ID:", result[0].headers["x-message-id"]);
    return true;
  } catch (error) {
    console.error("❌ SendGrid test failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("Response body:", error.response.body);
    }
    return false;
  }
}

testSendGridDirectly();
