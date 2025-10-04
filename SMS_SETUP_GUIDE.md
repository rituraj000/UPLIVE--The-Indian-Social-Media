# SMS Provider Setup Guide

This guide will help you configure SMS providers for phone number verification in your UPLIVE application.

## Supported Providers

### 1. MSG91 (Indian SMS Provider - Recommended for India)

MSG91 is a popular SMS provider in India with good delivery rates.

**Setup Steps:**
1. Sign up at [https://msg91.com/](https://msg91.com/)
2. Get your API credentials from the dashboard
3. Create an OTP template
4. Add to your `.env` file:

```env
MSG91_API_KEY=your-msg91-api-key
MSG91_SENDER_ID=your-sender-id
MSG91_TEMPLATE_ID=your-template-id
```

**Template Example:**
```
Your UPLIVE verification code is ##OTP##. Valid for 10 minutes. Do not share this code with anyone.
```

### 2. Twilio (International SMS Provider)

Twilio is a reliable international SMS provider.

**Setup Steps:**
1. Sign up at [https://www.twilio.com/](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Get a Twilio phone number
4. Add to your `.env` file:

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### 3. AWS SNS (Amazon Simple Notification Service)

AWS SNS is a scalable SMS service from Amazon.

**Setup Steps:**
1. Create an AWS account
2. Set up IAM credentials with SNS permissions
3. Add to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region (e.g., us-east-1)
```

## Configuration Priority

The system tries providers in this order:
1. **Twilio** (if configured)
2. **MSG91** (if configured)
3. **AWS SNS** (if configured)
4. **Mock SMS** (development mode only)

## Quick Setup for Indian Users (MSG91)

1. Go to [MSG91](https://msg91.com/) and sign up
2. Verify your account and get API key
3. Create an OTP template in their dashboard
4. Copy your credentials to `.env`:

```env
MSG91_API_KEY=your-api-key-here
MSG91_SENDER_ID=UPLIVE
MSG91_TEMPLATE_ID=your-template-id
```

## Testing

In development mode, if no SMS provider is configured, the system will use mock SMS and print OTP codes to the console.

To test with real SMS:
1. Configure at least one provider
2. Start your backend server
3. Try registering with a phone number
4. Check your phone for the OTP

## Troubleshooting

### Common Issues:

1. **"No SMS provider configured"**
   - Make sure you've added credentials to `.env`
   - Restart the server after adding environment variables

2. **"SMS sending failed"**
   - Check your API credentials
   - Verify your account has sufficient balance
   - Check if the phone number format is correct

3. **Phone number format issues**
   - The system automatically formats numbers for Indian users
   - Use format: +91XXXXXXXXXX for India
   - Other countries: +[country_code][number]

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed SMS sending logs in the console.

## Security Notes

- Never commit your `.env` file to git
- Use different credentials for development and production
- Regularly rotate your API keys
- Monitor SMS usage to prevent abuse

## Cost Optimization

- Use MSG91 for Indian numbers (cheaper)
- Use Twilio for international numbers
- Implement rate limiting to prevent SMS spam
- Set up monitoring for unusual usage patterns