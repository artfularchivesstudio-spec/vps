#!/bin/bash

# 🔍 Debug Strapi Startup - Let's see what's happening!

echo "=== 🔍 STRAPI DEBUG SESSION ==="
echo "Current working directory: $(pwd)"
echo "User: $(whoami)"
echo "Date: $(date)"
echo

# Check Node.js
echo "=== Node.js Check ==="
which node && node --version || echo "❌ Node.js not found in PATH"
which npm && npm --version || echo "❌ npm not found in PATH"
echo

# Load NVM
echo "=== Loading NVM ==="
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && echo "✅ NVM loaded" || echo "❌ NVM not found"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Try to use Node 18
echo "=== Setting Node Version ==="
nvm use 18 && echo "✅ Using Node $(node --version) and npm $(npm --version)" || echo "❌ Failed to set Node version"
echo

# Navigate to Strapi
echo "=== Strapi Directory ==="
cd /root/api-gateway/strapi
echo "Current directory: $(pwd)"
ls -la package.json 2>/dev/null && echo "✅ package.json found" || echo "❌ package.json missing"
ls -la node_modules 2>/dev/null | head -3 && echo "✅ node_modules exists" || echo "❌ node_modules missing"
echo

# Check environment
echo "=== Environment Check ==="
ls -la .env && echo "✅ .env file found" || echo "❌ .env file missing"
echo

# Try to install dependencies
echo "=== Installing Dependencies ==="
npm install --verbose 2>&1 | head -20
echo

# Try to start Strapi
echo "=== Starting Strapi ==="
npm run start 2>&1 | head -30

