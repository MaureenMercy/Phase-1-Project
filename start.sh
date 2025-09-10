#!/bin/bash

# IEBC Election Management System Startup Script

echo "🏛️  Starting IEBC Election Management System..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please ensure MongoDB is installed and running."
    echo "   You can install MongoDB from: https://www.mongodb.com/try/download/community"
    echo "   Or use MongoDB Atlas: https://www.mongodb.com/atlas"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/candidates

# Seed initial data
echo "🌱 Seeding initial data..."
node scripts/seedData.js

# Start the server
echo "🚀 Starting the server..."
echo ""
echo "The IEBC Election Management System is now running!"
echo ""
echo "🌐 Web Interface: http://localhost:3000"
echo "📊 API Endpoint: http://localhost:3000/api"
echo "❤️  Health Check: http://localhost:3000/api/health"
echo ""
echo "Default login credentials:"
echo "  HQ Official: admin@iebc.go.ke / admin123"
echo "  Regional Officer: nairobi@iebc.go.ke / regional123"
echo "  Legal Auditor: legal@iebc.go.ke / legal123"
echo "  Judiciary Observer: judiciary@iebc.go.ke / judiciary123"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start