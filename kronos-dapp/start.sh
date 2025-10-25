#!/bin/bash

echo "🚀 Starting Kronos DApp with Real-time Data..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Kill any existing processes on ports 3001 and 3002
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Port 3001 is clear"
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "Port 3002 is clear"
sleep 2

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd app
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build frontend for production
echo "🔨 Building frontend for production..."
npm run build

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../server
if [ ! -d "node_modules" ]; then
    npm install
fi

# Start backend server in background
echo "🔧 Starting backend server (Port 3001)..."
cd ../server
npm start &
BACKEND_PID=$!

# Wait for backend to start and verify
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is running on port 3001"
else
    echo "❌ Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend development server
echo "🌐 Starting frontend development server (Port 3002)..."
cd ../app
PORT=3002 npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Check if frontend is running
if curl -s http://localhost:3002 > /dev/null; then
    echo "✅ Frontend server is running on port 3002"
else
    echo "❌ Frontend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Kronos DApp is now running with real-time data!"
echo "🔗 Frontend: http://localhost:3002"
echo "🔗 Backend API: http://localhost:3001"
echo "🔗 Health Check: http://localhost:3001/health"
echo "🔗 Popular Cryptos API: http://localhost:3001/api/cryptos/popular"
echo ""
echo "📊 Features:"
echo "   • Real-time cryptocurrency data from Binance API"
echo "   • Auto-refresh every 30 seconds"
echo "   • Manual refresh button"
echo "   • Kronos AI prediction model"
echo "   • Historical and predicted price charts"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    sleep 2
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
