#!/bin/bash

# UPLIVE Development Environment Startup Script
echo "🚀 Starting UPLIVE Development Environment..."

# Set development environment variables
export CLIENT_URL="http://localhost:3000"
export NODE_ENV="development"
export PORT="5000"

# Load other environment variables from .env file
if [ -f "backend/.env" ]; then
    echo "📋 Loading environment variables from backend/.env"
    export $(grep -v '^#' backend/.env | xargs)
fi

# Override CLIENT_URL for development
export CLIENT_URL="http://localhost:3000"

echo "🌐 CLIENT_URL set to: $CLIENT_URL"
echo "🔧 NODE_ENV set to: $NODE_ENV"
echo "🚪 PORT set to: $PORT"

# Start backend server
echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "🎉 Development environment started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo "📊 API Health: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
