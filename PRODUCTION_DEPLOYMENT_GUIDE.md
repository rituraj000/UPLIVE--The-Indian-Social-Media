# 🚀 UPLIVE Production Deployment Guide

## ❌ Current Issues Causing Timeout Error

### 1. **Backend Environment Variables**
Your deployed backend needs these environment variables configured on the hosting platform:

```bash
# Core Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://instastartup:instadbpassword@insta.amuimrw.mongodb.net/instagram-clone?retryWrites=true&w=majority&appName=Insta

# Authentication
JWT_SECRET=instagram_clone_jwt_secret_key_2024

# Frontend URL (replace with your actual deployed frontend URL)
CLIENT_URL=https://your-frontend-domain.com

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=dvvzjj5fn
CLOUDINARY_API_KEY=143254553353363
CLOUDINARY_API_SECRET=4MtMwHBuIRidh7rTl1aywjSBD5I

# Email Service (for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=noreply.uplive@gmail.com
EMAIL_PASS=ndnf vxqx xypf zykd
```

### 2. **Platform-Specific Setup**

#### **If using Render.com:**
1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add each environment variable above
5. Make sure to set `NODE_ENV=production`
6. Deploy the latest commit

#### **If using Vercel:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable above
4. Redeploy your project

#### **If using Railway:**
1. Go to your Railway project
2. Click on "Variables" tab  
3. Add each environment variable
4. Redeploy the service

### 3. **CORS Configuration**
Make sure your backend server.js has proper CORS setup for production:

```javascript
// In your server.js, make sure you have:
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com' // Add your actual frontend URL
  ],
  credentials: true
}));
```

### 4. **Frontend Configuration**
Your frontend api.ts is correctly configured to use:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://uplive-the-indian-social-media.onrender.com/api';
```

But make sure you set this environment variable in your frontend deployment:
```bash
REACT_APP_API_URL=https://uplive-the-indian-social-media.onrender.com/api
```

## 🔍 **Debugging Steps**

### Step 1: Check if Backend is Running
Visit your backend URL directly:
```
https://uplive-the-indian-social-media.onrender.com/api/auth/send-otp
```
You should get a method not allowed or missing parameters error, not a timeout.

### Step 2: Test Backend Health
Create a simple health check endpoint in your backend:
```javascript
// Add this to your server.js
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});
```

### Step 3: Check Environment Variables
Add logging to your backend to verify environment variables:
```javascript
console.log('Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
```

## ⚡ **Quick Fix Checklist**

- [ ] Set `NODE_ENV=production` on your hosting platform
- [ ] Add all environment variables to your hosting platform
- [ ] Update `CLIENT_URL` to your actual frontend domain
- [ ] Ensure CORS is configured for your frontend domain
- [ ] Redeploy both frontend and backend
- [ ] Test the health endpoint
- [ ] Check hosting platform logs for errors

## 🎯 **Expected Behavior After Fix**

1. ✅ Backend responds within 30 seconds
2. ✅ OTP emails are sent to real Gmail addresses  
3. ✅ Environment variables are properly loaded
4. ✅ No timeout errors in frontend console

## 📞 **Still Having Issues?**

1. Check your hosting platform's logs for specific error messages
2. Verify your MongoDB Atlas allows connections from your hosting platform
3. Ensure your domain/hosting provider allows email sending
4. Test with a simple API endpoint first before testing OTP functionality