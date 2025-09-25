#!/bin/bash

# 🚀 Blog Post Access Fix Script
# 💪 Resolves 403 Forbidden errors by applying RLS fixes

echo "🎭 Artful Archives Studio - Blog Post Access Fix"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this script from the project root directory."
  exit 1
 fi

# Apply the new migration to Supabase
echo "📦 Applying RLS policy fix to Supabase..."
if command -v npx &> /dev/null; then
  npx supabase migration up
  if [ $? -ne 0 ]; then
    echo "⚠️ Warning: Migration command failed. You may need to apply the migration manually."
  fi
else
  echo "⚠️ Warning: npx not found. Please run 'npx supabase migration up' manually."
fi

# Restart the development server
echo "🔄 Restarting development server..."
if [ -f "node_modules/.bin/next" ]; then
  # Kill any running Next.js processes
  pkill -f "next dev" || true
  
  # Start the development server in the background
  npm run dev &
  
  echo "✅ Development server restarted!"
else
  echo "⚠️ Warning: Next.js not found. Please restart your development server manually."
fi

echo ""
echo "🎉 Fix applied successfully!"
echo "📝 Note: If you're still seeing 403 errors, you may need to:"
echo "   1. Clear your browser cache"
echo "   2. Restart your browser"
echo "   3. Check the Supabase dashboard for any RLS policy issues"
echo ""