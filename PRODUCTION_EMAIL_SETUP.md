# Production Email Setup Guide

## Issue
Email verification works locally but fails in production deployment because environment variables are not configured on the deployment platform.

## Required Environment Variables for Production

Add these environment variables to your deployment platform (Render, Vercel, Heroku, etc.):

```
EMAIL_SERVICE=gmail
EMAIL_USER=noreply.uplive@gmail.com
EMAIL_PASS=aqaipittletgvahl
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

## Platform-Specific Instructions

### For Render.com (Backend Deployment)
1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add each environment variable:
   - `EMAIL_SERVICE` = `gmail`
   - `EMAIL_USER` = `noreply.uplive@gmail.com`
   - `EMAIL_PASS` = `aqaipittletgvahl`
   - `CLIENT_URL` = `https://your-frontend-domain.vercel.app` (or your actual frontend URL)
   - `NODE_ENV` = `production`

### For Vercel (Frontend Deployment)
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add `REACT_APP_API_URL` = `https://your-backend-domain.onrender.com`

### For Heroku
1. Go to your app dashboard
2. Settings > Config Vars
3. Add all the environment variables listed above

## Gmail App Password Setup
The `EMAIL_PASS` should be a Gmail App Password, not your regular Gmail password:

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security
3. Under "Signing in to Google", select "App passwords"
4. Generate a new app password for "Mail"
5. Use this 16-character password as `EMAIL_PASS`

## Testing Production Email
After setting up environment variables:

1. Redeploy your backend service
2. Check the deployment logs for email initialization messages
3. Test registration with a real email address
4. Check spam folder if email doesn't arrive in inbox

## Troubleshooting

### Common Issues:
1. **Environment variables not set**: Check deployment platform settings
2. **Wrong CLIENT_URL**: Should match your actual frontend domain
3. **Gmail blocking**: Use App Password instead of regular password
4. **Firewall/Network**: Some hosting providers block SMTP ports

### Debug Steps:
1. Check deployment logs for "Email service initialized successfully" message
2. Look for error messages during email sending
3. Verify all environment variables are set correctly
4. Test with multiple email providers (Gmail, Yahoo, etc.)

## Security Notes
- Never commit `.env` files to GitHub
- Use different credentials for production vs development
- Consider using environment-specific email addresses
- Regularly rotate App Passwords