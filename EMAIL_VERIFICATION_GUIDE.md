# 📧 UPLIVE Email Verification System

## 🎯 Overview

A complete, production-ready email verification workflow implemented for the UPLIVE social media platform using MongoDB, Node.js, Express, React, and TypeScript.

## ✨ Features Implemented

### ✅ Backend Features
- **MongoDB-based token storage** - Secure verification tokens with expiration
- **Rate limiting** - Prevents spam and abuse (5 resends per hour per email/IP)
- **Email queue system** - Background email sending with BullMQ and Redis
- **Security hardening** - Cryptographically secure tokens, input validation, CORS
- **Health monitoring** - Health checks, metrics, and logging
- **Clean architecture** - Service layer, proper error handling, graceful degradation

### ✅ Frontend Features
- **Email verification UI** - Complete verification flow with Indian branding
- **Registration updates** - Handles verification requirement
- **Login protection** - Blocks unverified users with clear messaging
- **Responsive design** - Mobile-first approach with Material-UI
- **User experience** - Clear instructions, error handling, success states

### ✅ Security Features
- **Cryptographically secure tokens** - 32-byte hex tokens (64 characters)
- **Single-use tokens** - Tokens marked as used after verification
- **Rate limiting** - Email and IP-based rate limiting
- **Input validation** - Server-side validation with express-validator
- **MongoDB injection protection** - Parameterized queries
- **CORS configuration** - Configurable allowed origins

## 🏗️ Architecture

### Database Schema (MongoDB)
```javascript
// EmailVerification Collection
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  token: String (unique, indexed),
  expiresAt: Date (indexed, TTL),
  used: Boolean (indexed),
  ipAddress: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}

// RateLimit Collection  
{
  _id: ObjectId,
  identifier: String (email or IP),
  action: String ('email_verification_resend'),
  count: Number,
  windowStart: Date,
  expiresAt: Date (TTL)
}

// Updated User Collection (additional fields)
{
  // ... existing fields ...
  isEmailVerified: Boolean (default: false),
  emailVerifiedAt: Date,
  registrationCompleted: Boolean (default: false)
}
```

### API Endpoints

#### Authentication Routes
```
POST /api/auth/register
- Creates user with isEmailVerified: false
- Generates verification token
- Queues verification email
- Returns: { message, requiresVerification: true }

POST /api/auth/verify-email
- Body: { token: string }
- Validates and marks token as used
- Updates user: isEmailVerified: true
- Returns: { token, user, message }

POST /api/auth/resend-verification
- Body: { email: string }  
- Rate limiting: 5 per hour per email/IP
- Generates new token if user exists and unverified
- Returns: Generic success message (prevents enumeration)

POST /api/auth/login
- Checks email verification status
- Returns 403 if not verified
- Returns: { token, user } if verified
```

#### Health & Monitoring
```
GET /api/health
- Service health status
- Database connection status
- Active verification counts

GET /api/ready
- Readiness check for deployments

GET /api/metrics
- Simple metrics without Prometheus dependency
- Memory usage, uptime, verification statistics
```

### Email Templates

#### Verification Email
- **Subject**: `🇮🇳 Verify your UPLIVE account - Made in India`
- **HTML**: Responsive design with Indian flag colors
- **Text**: Plain text fallback
- **Features**: Indian branding, clear CTAs, security messaging

#### Welcome Email  
- **Subject**: `🇮🇳 Welcome to UPLIVE, {username}! - India's Own Social Platform`
- **Content**: Feature highlights, getting started guide
- **Branding**: "Made in India" messaging throughout

## 🚀 Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install bullmq ioredis nodemailer uuid
```

#### Environment Variables
```bash
# Add to backend/.env
EMAIL_SERVICE=gmail
EMAIL_USER=noreply.uplive@gmail.com
EMAIL_PASS=your_app_specific_password
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

#### Gmail App Password Setup
1. Enable 2FA on Gmail account
2. Generate App Password: Account Settings → Security → App Passwords
3. Use app password in EMAIL_PASS (not regular password)

### 2. Database Migration
No additional migration needed - MongoDB will create collections automatically with proper indexes.

### 3. Redis Setup (Optional)
```bash
# Install Redis
sudo apt install redis-server  # Ubuntu/Debian
brew install redis             # macOS

# Start Redis
redis-server
```

If Redis is not available, the system falls back to in-memory queuing.

### 4. Frontend Setup
No additional dependencies needed. Email verification components are included.

## 🔧 Development Workflow

### Start Development
```bash
# Terminal 1: Start main server
npm run dev

# Terminal 2: Start email worker (optional)
npm run worker

# Terminal 3: Start Redis (if using queue)
redis-server
```

### Testing Email System
```bash
# Test the email verification system
node scripts/test-email-system.js

# Cleanup expired tokens
node scripts/cleanup-tokens.js
```

## 📱 User Flow

### Registration Flow
1. **User submits registration form**
   - Frontend: `POST /register` with user data
   - Backend: Creates user with `isEmailVerified: false`
   - Backend: Generates secure verification token
   - Backend: Queues verification email

2. **User receives email**
   - Email contains verification link with token
   - Link points to: `/verify-email?token={token}`

3. **User clicks verification link**
   - Frontend: Loads EmailVerification component
   - Frontend: `POST /verify-email` with token
   - Backend: Validates token, marks as used
   - Backend: Updates user: `isEmailVerified: true`
   - Frontend: Auto-login and redirect to home

### Login Protection
1. **User attempts login**
   - Frontend: `POST /login` with credentials
   - Backend: Checks password, then email verification
   - If not verified: Returns 403 with `requiresVerification: true`
   - Frontend: Shows verification message with resend option

### Resend Verification
1. **User requests resend**
   - Frontend: `POST /resend-verification` with email
   - Backend: Rate limiting check (5 per hour)
   - Backend: Generates new token if user exists and unverified
   - Backend: Returns generic success message

## 🔒 Security Measures

### Token Security
- **Generation**: `crypto.randomBytes(32).toString('hex')`
- **Length**: 64-character hexadecimal string
- **Uniqueness**: Database unique constraint
- **Expiration**: 24 hours from creation
- **Single-use**: Marked as used after verification

### Rate Limiting
```javascript
// Registration/Login: 20 requests per 15 minutes
// Email resend: 5 requests per hour per email/IP
// Configurable limits with express-rate-limit
```

### Input Validation
```javascript
// Server-side validation with express-validator
username: { min: 3, alphanumeric, trim, escape }
email: { isEmail, normalize }
password: { min: 6 }
token: { min: 32, hex format }
```

### Database Security
- **No SQL injection**: Mongoose parameterized queries
- **Indexes**: Efficient queries on token, user, expiration
- **TTL**: Automatic cleanup of expired documents
- **Atomic operations**: Prevents race conditions

## 📊 Monitoring & Operations

### Health Checks
```bash
# Basic health check
curl http://localhost:5000/api/health

# Readiness check (for K8s/Docker)
curl http://localhost:5000/api/ready

# Metrics (simple JSON format)
curl http://localhost:5000/api/metrics
```

### Logging
All operations logged with structured JSON:
```javascript
{
  "level": "info",
  "message": "Email verification completed",
  "userId": "...",
  "email": "...", 
  "correlationId": "...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Cleanup Jobs
```bash
# Manual cleanup of expired tokens (7+ days old)
npm run cleanup

# Recommended: Add to cron
0 2 * * * cd /path/to/backend && npm run cleanup
```

## 🐛 Troubleshooting

### Common Issues

#### Email Not Sending
```bash
# Check credentials
node scripts/test-email-system.js

# Verify Gmail app password
# Check spam folder
# Verify EMAIL_USER and EMAIL_PASS in .env
```

#### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# The system works without Redis (falls back to memory)
# Just won't persist email queue across restarts
```

#### Token Validation Errors
```bash
# Check MongoDB connection
# Verify token hasn't expired (24h limit)
# Check if token was already used
# Verify token format (64-char hex)
```

#### Rate Limiting Issues
```bash
# Check rate limit records in MongoDB
db.ratelimits.find({ identifier: "user@example.com" })

# Clear rate limits (emergency)
db.ratelimits.deleteMany({ identifier: "user@example.com" })
```

## 🚀 Production Deployment

### Environment Configuration
```bash
# Production .env
NODE_ENV=production
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_production_app_password
REDIS_URL=your_production_redis_url
MONGODB_URI=your_production_mongodb_url
CLIENT_URL=https://yourdomain.com
```

### Process Management
```bash
# Option 1: PM2
pm2 start server.js --name uplive-api
pm2 start workers/email-worker.js --name uplive-worker

# Option 2: Docker
# Dockerfile included for containerization
```

### Monitoring Setup
- **Health Checks**: `/api/health` for load balancer
- **Metrics**: `/api/metrics` for monitoring systems
- **Logs**: Structured JSON for log aggregation
- **Alerts**: Monitor failed email sends and verification rates

### Scaling Considerations
- **Redis Cluster**: For high-volume email queues
- **Multiple Workers**: Scale email workers horizontally
- **Database Indexing**: Ensure proper indexes for performance
- **CDN**: Serve email assets (images, CSS) from CDN

## 📈 Performance Metrics

### Expected Performance
- **Token Generation**: < 1ms
- **Database Writes**: < 50ms (verification record)
- **Email Queuing**: < 10ms (Redis)
- **Email Sending**: 1-5 seconds (Gmail SMTP)
- **Token Validation**: < 20ms (MongoDB query)

### Optimization Tips
1. **Database Indexes**: Already included for optimal queries
2. **Redis Persistence**: Configure based on email volume
3. **Email Templates**: Pre-compile for better performance
4. **Connection Pooling**: MongoDB connection reuse
5. **Batch Processing**: Process multiple emails together

## 🔮 Future Enhancements

### Planned Features
- [ ] **SMS Verification**: Alternative to email
- [ ] **Magic Links**: Passwordless login
- [ ] **Multi-language**: Email templates in multiple languages
- [ ] **Advanced Analytics**: Detailed verification metrics
- [ ] **Admin Dashboard**: Manage verifications and users

### Integration Options
- [ ] **Twilio**: SMS verification
- [ ] **SendGrid**: Better email delivery
- [ ] **Prometheus**: Advanced metrics
- [ ] **Sentry**: Error tracking
- [ ] **Datadog**: APM integration

---

## 🎉 System Status

✅ **Production Ready** - Complete email verification workflow  
✅ **Security Hardened** - Rate limiting, validation, secure tokens  
✅ **Well Tested** - Comprehensive error handling and edge cases  
✅ **Documented** - Complete setup and troubleshooting guide  
✅ **Scalable** - Queue system, monitoring, cleanup jobs  
✅ **Indian Themed** - 🇮🇳 "Made in India" branding throughout  

**The UPLIVE email verification system is ready for production use!** 🚀