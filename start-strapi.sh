#!/bin/bash

# 🌟 The Strapi Startup Wizard - Getting Your CMS Running!

echo "🚀 Starting Strapi with proper Node.js environment..."

# 🔍 Check for PM2 conflicts first
echo "🔍 Checking for PM2 conflicts..."
if pm2 list 2>/dev/null | grep -q "strapi"; then
    echo "⚠️  PM2 is managing Strapi processes!"
    echo "📋 Current PM2 status:"
    pm2 list
    echo
    echo "💡 Choose an option:"
    echo "1. Stop PM2 Strapi processes and continue"
    echo "2. Exit and manage PM2 manually"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo "🛑 Stopping PM2 Strapi processes..."
        pm2 stop strapi 2>/dev/null || true
        pm2 delete strapi 2>/dev/null || true
        echo "✅ PM2 processes cleared"
    else
        echo "🚪 Exiting. Use 'pm2 stop all && pm2 delete all' to clear PM2 processes"
        exit 0
    fi
fi

# 🔍 Check if port 1337 is in use
if lsof -i :1337 2>/dev/null; then
    echo "⚠️  Port 1337 is already in use:"
    lsof -i :1337
    echo
    echo "💡 Kill the process with: kill [PID_NUMBER]"
    echo "💡 Or run: ./check-pm2.sh for more options"
    exit 1
fi

# Load NVM if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Check if we have node and npm
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "✅ Node.js $(node --version) and npm $(npm --version) are available"
else
    echo "❌ Node.js or npm not found. Trying to use nvm..."
    nvm use 18 2>/dev/null || nvm install 18
fi

# Navigate to Strapi directory
cd /root/api-gateway/strapi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start Strapi
echo "🌟 Starting Strapi server..."
npm run start

