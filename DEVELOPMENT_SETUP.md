# UPLIVE Development Environment Setup

## 🚀 Quick Start

### Option 1: Using the Backend Local Script (Recommended)
```bash
# Make the script executable (if not already done)
chmod +x start-backend-local.sh

# Start backend with correct environment variables
./start-backend-local.sh
```

### Option 2: Using the Full Development Script
```bash
# Make the script executable (if not already done)
chmod +x start-dev.sh

# Start both frontend and backend
./start-dev.sh
```

### Option 3: Manual Setup

#### 1. Start Backend Server
```bash
cd backend
CLIENT_URL=http://localhost:3000 NODE_ENV=development npm start
```

#### 2. Start Frontend Server (in a new terminal)
```bash
cd frontend
npm start
```

## 🔧 Environment Configuration

### Backend Environment Variables
The backend is configured to use local URLs when `NODE_ENV=development` and `CLIENT_URL=http://localhost:3000`:

- **Verification URLs**: `http://localhost:3000/verify-email?token=...`
- **Reset Password URLs**: `http://localhost:3000/reset-password?token=...`
- **API Base URL**: `http://localhost:5000/api`
- **Rate Limiting**: More generous limits in development (1000 requests vs 100 in production)

### Frontend Configuration
The frontend is configured to proxy API requests to the backend:
- **Development**: Uses proxy to `http://localhost:5000/api`
- **Production**: Uses environment variable `REACT_APP_API_URL`

## 🧪 Testing APIs

### Test Forgot Password with Local URLs
```bash
node test-forgot-password.js
```

### Test All APIs
```bash
node test_all_apis.js
```

## 📱 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health
- **API Status**: http://localhost:5000/api/status

## 🔍 Verification

### Check if URLs are Local
1. Register a new user or request password reset
2. Check the backend terminal logs
3. Verify the generated URLs start with `http://localhost:3000`
4. Check your email for the verification/reset links

### Expected Log Output
```
🔗 Verification URL generated: http://localhost:3000/verify-email?token=...
🔗 Reset URL generated: http://localhost:3000/reset-password?token=...
```

## 🐛 Troubleshooting

### Backend Not Starting
- Check if port 5000 is already in use: `lsof -i :5000`
- Kill existing processes: `pkill -f "node server.js"`

### Frontend Not Connecting to Backend
- Verify backend is running on port 5000
- Check proxy configuration in `frontend/package.json`
- Ensure `REACT_APP_API_URL=http://localhost:5000/api` in frontend `.env`

### URLs Still Pointing to Production
- Ensure `CLIENT_URL=http://localhost:3000` is set
- Ensure `NODE_ENV=development` is set
- Restart the backend server

## 📧 Email Testing

### Development Email Setup
- Emails are sent via SendGrid (configured in backend)
- Check your email inbox for verification/reset links
- Links should point to `http://localhost:3000`

### Test Email Endpoints
```bash
# Test forgot password
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPassword123!","fullName":"Test User"}'
```

## 🎯 Key Features Tested

✅ **Health Endpoints**: `/api/health`, `/api/status`  
✅ **Authentication**: Registration, Login, Forgot Password  
✅ **User Management**: Profile, Follow/Unfollow  
✅ **Posts**: Create, Like, Comment, Save  
✅ **Stories**: Create, View, Delete  
✅ **Messaging**: Send, Receive, Conversations  
✅ **Notifications**: Get, Mark as Read  
✅ **Frontend Integration**: Proxy, CORS, Socket.io  

## 🔄 Development Workflow

1. **Start Development Environment**: `./start-dev.sh`
2. **Make Changes**: Edit code in your preferred editor
3. **Test APIs**: Use the test scripts or frontend
4. **Check Logs**: Monitor backend terminal for URL generation
5. **Verify Emails**: Check email for local URLs

## 📝 Notes

- The backend automatically detects development mode and uses local URLs
- Email verification and password reset links will work with your local frontend
- All API endpoints are tested and working
- CORS is properly configured for local development
- Socket.io is configured for real-time messaging
