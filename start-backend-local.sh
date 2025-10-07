#!/bin/bash

# UPLIVE Backend Local Development Startup Script
echo "🚀 Starting UPLIVE Backend for Local Development..."

# Kill any existing server processes
echo "🛑 Stopping any existing backend servers..."
pkill -f "node server.js" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Set environment variables for local development
export CLIENT_URL="http://localhost:3000"
export NODE_ENV="development"
export PORT="5000"

echo "🔧 Environment variables set:"
echo "   CLIENT_URL: $CLIENT_URL"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"

# Start the backend server
echo "🔧 Starting backend server..."
cd backend
npm start

echo "✅ Backend server started!"
echo "📱 Frontend should connect to: http://localhost:5000/api"
echo "🔗 Reset/Verification URLs will use: http://localhost:3000"
