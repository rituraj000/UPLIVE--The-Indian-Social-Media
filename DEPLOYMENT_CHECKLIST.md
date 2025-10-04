# Render Deployment Checklist

## Pre-Deployment Checklist

- [x] Code is working locally ✅
- [x] Phone and email verification working ✅
- [x] Login with both email and phone working ✅
- [x] All changes committed and pushed to GitHub ✅

## Environment Variables to Update for Production

### 🚨 CRITICAL UPDATES NEEDED:

1. **CLIENT_URL** (Backend):
   - Current: `http://localhost:3000`
   - Update to: `https://your-frontend-name.onrender.com`

2. **REACT_APP_API_URL** (Frontend):
   - Add new variable: `https://your-backend-name.onrender.com/api`

### Keep Same (Production Ready):
- `MONGODB_URI` ✅ (MongoDB Atlas)
- `JWT_SECRET` ✅ 
- `CLOUDINARY_*` ✅ (Cloud service)
- `EMAIL_*` ✅ (Gmail SMTP)
- `TWILIO_*` ✅ (Cloud service)

## Deployment Steps

### Step 1: Deploy Backend
1. Create new Web Service on Render
2. Connect GitHub repo: `rituraj000/UPLIVE--The-Indian-Social-Media`
3. Settings:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty
4. Add all environment variables from current .env (except update CLIENT_URL later)
5. Deploy and note the backend URL

### Step 2: Deploy Frontend  
1. Create new Static Site on Render
2. Connect same GitHub repo
3. Settings:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Root Directory**: Leave empty
4. Add environment variable:
   - `REACT_APP_API_URL=https://[your-backend-url]/api`
5. Deploy and note the frontend URL

### Step 3: Update Backend CLIENT_URL
1. Go to backend service on Render
2. Update `CLIENT_URL` to your frontend URL
3. Redeploy backend service

## Post-Deployment Testing

Test these features in production:

- [ ] User registration with email
- [ ] Email verification 
- [ ] User registration with phone
- [ ] SMS verification
- [ ] Login with email
- [ ] Login with phone number
- [ ] Password reset
- [ ] Image upload
- [ ] Create posts
- [ ] Follow/unfollow users
- [ ] Real-time messaging

## Common Issues & Solutions

**CORS Errors**: Make sure CLIENT_URL is set correctly in backend
**API Errors**: Verify REACT_APP_API_URL points to correct backend URL
**SMS Not Working**: Check Twilio credentials and phone number
**Email Not Working**: Verify Gmail app password
**Database Errors**: Check MongoDB Atlas connection string

## Production URLs (Fill after deployment):

- Backend: `https://________________.onrender.com`
- Frontend: `https://________________.onrender.com`