# Render Environment Variables Configuration

## Backend Service Environment Variables

Copy these environment variables to your Render backend service:

### Required Variables:
```
NODE_ENV=production
PORT=5000
```

### Database:
```
MONGODB_URI=mongodb+srv://instastartup:instadbpassword@insta.amuimrw.mongodb.net/instagram-clone?retryWrites=true&w=majority&appName=Insta
```

### Security:
```
JWT_SECRET=instagram_clone_jwt_secret_key_2024
```

### Frontend URL (UPDATE THIS):
```
CLIENT_URL=https://your-frontend-app-name.onrender.com
```

### Cloudinary (Image/Video Upload):
```
CLOUDINARY_CLOUD_NAME=dvvzjj5fn
CLOUDINARY_API_KEY=143254553353363
CLOUDINARY_API_SECRET=4MtMwHBuIRidh7rTl1aywjSBD5I
CLOUDINARY_URL=cloudinary://143254553353363:4MtMwHBuIRidh7rTl1aywjSBD5I@dvvzjj5fn
```

### Email Configuration:
```
EMAIL_SERVICE=gmail
EMAIL_USER=noreply.uplive@gmail.com
EMAIL_PASS=aqaipittletgvahl
```

### Twilio SMS Configuration:
```
TWILIO_ACCOUNT_SID=AC2fb406f916df5c20bb4b0c7f59467dc9
TWILIO_AUTH_TOKEN=ce2a22d6413610ca17898321c23f8b86
TWILIO_PHONE_NUMBER=+15136549592
```

### Optional:
```
LOG_LEVEL=info
```

## Frontend Environment Variables

For your frontend service, you'll need:

### API URL (UPDATE THIS):
```
REACT_APP_API_URL=https://your-backend-app-name.onrender.com/api
```

## Important Notes:

1. **CLIENT_URL**: Replace `your-frontend-app-name` with your actual Render frontend service name
2. **REACT_APP_API_URL**: Replace `your-backend-app-name` with your actual Render backend service name
3. **Production URLs**: Render will provide you with the actual URLs after deployment
4. **Security**: All these variables should be added in the Render dashboard, not committed to Git

## Steps to Deploy:

1. **Backend Service**:
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Set Build Command: `cd backend && npm install`
   - Set Start Command: `cd backend && npm start`
   - Add all the backend environment variables above

2. **Frontend Service**:
   - Create a new Static Site on Render
   - Connect your GitHub repository
   - Set Build Command: `cd frontend && npm install && npm run build`
   - Set Publish Directory: `frontend/build`
   - Add the frontend environment variables above

3. **Update URLs**:
   - After both services are deployed, update the URLs in environment variables
   - Redeploy both services

## Deployment Order:
1. Deploy backend first
2. Note the backend URL
3. Deploy frontend with the correct backend URL
4. Update backend CLIENT_URL with frontend URL
5. Redeploy backend

## Testing Production:
- Test email verification
- Test SMS verification  
- Test both email and phone login
- Test image uploads
- Test all major features