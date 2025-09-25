#!/bin/bash

# Deploy Supabase Edge Functions
# Make sure you have the Supabase CLI installed: npm install -g supabase

set -e

echo "🚀 Deploying Supabase Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're logged in
if ! supabase status &> /dev/null; then
    echo "🔐 Please login to Supabase first: supabase login"
    exit 1
fi

# Deploy all edge functions
echo "📦 Deploying posts function..."
supabase functions deploy posts

echo "📦 Deploying ai-analyze-image function..."
supabase functions deploy ai-analyze-image

echo "📦 Deploying ai-generate-audio function..."
supabase functions deploy ai-generate-audio

echo "✅ All edge functions deployed successfully!"

# Set environment variables (you'll need to do this manually in Supabase dashboard)
echo ""
echo "🔧 Don't forget to set these environment variables in your Supabase dashboard:"
echo "   - OPENAI_API_KEY"
echo "   - CLAUDE_API_KEY"
echo "   - ELEVENLABS_API_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "📊 Functions Dashboard: https://supabase.com/dashboard/project/[your-project-id]/functions"
echo ""
echo "🎉 Edge Functions are now live at:"
echo "   - https://[your-project-id].supabase.co/functions/v1/posts"
echo "   - https://[your-project-id].supabase.co/functions/v1/ai-analyze-image"
echo "   - https://[your-project-id].supabase.co/functions/v1/ai-generate-audio" 