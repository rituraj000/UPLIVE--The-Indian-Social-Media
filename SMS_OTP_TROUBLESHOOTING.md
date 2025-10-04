# SMS OTP Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to send OTP, please try again"

This generic error can have several causes:

#### A. SMS Provider Configuration Issues
- **Twilio**: Check if `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are correctly set
- **MSG91**: Set up `MSG91_API_KEY`, `MSG91_SENDER_ID`, and `MSG91_TEMPLATE_ID` for Indian numbers
- **AWS SNS**: Configure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

#### B. Twilio Trial Account Limitations
- **Problem**: Twilio trial accounts can only send SMS to verified phone numbers
- **Solution**: 
  1. Go to Twilio Console → Phone Numbers → Manage → Verified Caller IDs
  2. Add and verify the phone numbers you want to test
  3. Or upgrade to a paid account

#### C. Phone Number Format Issues
- **Problem**: Invalid phone number format
- **Solution**: Use international format (+country_code + number)
  - ✅ Correct: `+919876543210` (India)
  - ✅ Correct: `+12345678901` (US)
  - ❌ Wrong: `9876543210` (missing country code)

#### D. Geographic Restrictions
- **Problem**: SMS provider doesn't support certain countries
- **Solution**: 
  1. For Twilio: Enable SMS permissions for target countries in console
  2. For Indian numbers: Use MSG91 instead of Twilio

#### E. Rate Limiting
- **Problem**: Too many SMS requests in short time
- **Solution**: 
  1. Wait 1-2 minutes before retrying
  2. Check if rate limiting is too strict in your code

### 2. Twilio-Specific Errors

#### Error 21614: "The phone number provided is not yet verified"
- **Cause**: Trial account trying to send to unverified number
- **Solution**: Add number to verified caller IDs or upgrade account

#### Error 21408: "Permission to send an SMS has not been enabled"
- **Cause**: SMS not enabled for target country
- **Solution**: Enable SMS permissions in Twilio console

#### Error 21211: "The 'To' number is not a valid phone number"
- **Cause**: Invalid phone number format
- **Solution**: Use proper international format

### 3. MSG91-Specific Issues

#### "Template not found" or "Invalid template"
- **Cause**: Template not approved or wrong template ID
- **Solution**: 
  1. Create and approve SMS template in MSG91 dashboard
  2. Update `MSG91_TEMPLATE_ID` in .env file

#### "DND number" Error
- **Cause**: Number is on Do Not Disturb registry
- **Solution**: 
  1. Use transactional SMS instead of promotional
  2. Request user to remove DND or use email verification

### 4. Network and Connectivity Issues

#### Connection Timeouts
- **Problem**: Network connectivity issues
- **Solution**: 
  1. Check internet connection
  2. Verify firewall settings
  3. Check if SMS provider APIs are accessible

### 5. Development Environment Issues

#### Environment Variables Not Loading
- **Problem**: `.env` file not found or not loaded properly
- **Solution**: 
  1. Ensure `.env` file exists in backend directory
  2. Check if `dotenv` is configured correctly
  3. Restart the server after changing .env

## Testing Tools

### Run Diagnostic Script
```bash
cd backend
node debug_sms_issues.js
```

### Test OTP Sending
```bash
cd backend
node test_otp_sending.js
```

## Production Recommendations

1. **Multiple Providers**: Configure multiple SMS providers for redundancy
2. **Rate Limiting**: Implement proper rate limiting (5 SMS/hour per user)
3. **Monitoring**: Set up alerts for SMS failures
4. **Fallback**: Implement email verification as fallback
5. **User Feedback**: Provide clear error messages to users

## Quick Fix Checklist

- [ ] Verify SMS provider credentials in .env file
- [ ] Check if phone number is in international format
- [ ] Confirm SMS provider supports the target country
- [ ] Check Twilio trial account limitations
- [ ] Verify network connectivity
- [ ] Check rate limiting settings
- [ ] Test with a known working phone number
- [ ] Review server logs for detailed error messages

## Contact Information

If issues persist:
1. Check SMS provider dashboards for detailed error logs
2. Test with different phone numbers
3. Try switching SMS providers
4. Contact SMS provider support for account-specific issues