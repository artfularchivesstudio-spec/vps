#!/bin/bash

# Setup Environment Variables for Supabase Edge Functions
# ⚠️  SAFE VERSION: Reads real API keys from .env file instead of using placeholders

PROJECT_REF="tjkpliasdjpgunbhsiza"

echo "⚠️  🚨 IMPORTANT SAFETY WARNING 🚨 ⚠️"
echo ""
echo "This script will set API keys in Supabase Edge Functions!"
echo "It will read REAL API keys from your .env file and upload them to Supabase."
echo ""
echo "⚠️  DO NOT RUN this script if:"
echo "   - You don't have real API keys in your .env file"
echo "   - Your .env file contains placeholder values like 'YOUR_ACTUAL_*_HERE'"
echo "   - You're not sure what this script does"
echo ""
echo "✅ ONLY RUN this script if:"
echo "   - You have verified your .env file contains real API keys"
echo "   - You want to update Supabase Edge Functions with these keys"
echo ""
echo "Press Ctrl+C to CANCEL, or Enter to continue..."
read

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create a .env file with your real API keys before running this script."
    echo "Example .env format:"
    echo "OPENAI_API_KEY=sk-proj-your-real-key-here"
    echo "CLAUDE_API_KEY=sk-ant-api03-your-real-key-here"
    echo "ELEVENLABS_API_KEY=sk_your-real-key-here"
    exit 1
fi

echo "🔍 Checking .env file for API keys..."

# Read API keys from .env file
OPENAI_KEY=$(grep "OPENAI_API_KEY=" .env | cut -d '=' -f2 | tr -d '"')
CLAUDE_KEY=$(grep "CLAUDE_API_KEY=" .env | cut -d '=' -f2 | tr -d '"')
ELEVENLABS_KEY=$(grep "ELEVENLABS_API_KEY=" .env | cut -d '=' -f2 | tr -d '"')

# Validate that we have real keys (not placeholders)
echo "🔍 Validating API keys..."

if [[ "$OPENAI_KEY" == *"YOUR_ACTUAL"* ]] || [[ "$OPENAI_KEY" == "" ]] || [[ "$OPENAI_KEY" == *"PLACEHOLDER"* ]]; then
    echo "❌ ERROR: OPENAI_API_KEY appears to be a placeholder or empty!"
    echo "Current value: $OPENAI_KEY"
    echo "Please set a real OpenAI API key in your .env file that starts with 'sk-proj-' or 'sk-'"
    exit 1
fi

if [[ "$CLAUDE_KEY" == *"YOUR_ACTUAL"* ]] || [[ "$CLAUDE_KEY" == "" ]] || [[ "$CLAUDE_KEY" == *"PLACEHOLDER"* ]]; then
    echo "❌ ERROR: CLAUDE_API_KEY appears to be a placeholder or empty!"
    echo "Current value: $CLAUDE_KEY"
    echo "Please set a real Claude API key in your .env file that starts with 'sk-ant-api'"
    exit 1
fi

if [[ "$ELEVENLABS_KEY" == *"YOUR_ACTUAL"* ]] || [[ "$ELEVENLABS_KEY" == "" ]] || [[ "$ELEVENLABS_KEY" == *"PLACEHOLDER"* ]]; then
    echo "❌ ERROR: ELEVENLABS_API_KEY appears to be a placeholder or empty!"
    echo "Current value: $ELEVENLABS_KEY"
    echo "Please set a real ElevenLabs API key in your .env file that starts with 'sk_'"
    exit 1
fi

echo "✅ API keys validation passed!"
echo ""
echo "🔧 Setting up environment variables for Supabase Edge Functions..."

# Set OpenAI API Key
echo "📝 Setting OpenAI API Key..."
supabase secrets set --project-ref $PROJECT_REF OPENAI_API_KEY="$OPENAI_KEY"

# Set Claude API Key  
echo "📝 Setting Claude API Key..."
supabase secrets set --project-ref $PROJECT_REF CLAUDE_API_KEY="$CLAUDE_KEY"

# Set ElevenLabs API Key
echo "📝 Setting ElevenLabs API Key..."
supabase secrets set --project-ref $PROJECT_REF ELEVENLABS_API_KEY="$ELEVENLABS_KEY"

# Set API Keys for Authentication (these are static keys for external service authentication)
echo "📝 Setting ChatGPT Actions API Key..."
supabase secrets set --project-ref $PROJECT_REF CHATGPT_ACTIONS_API_KEY="chatgpt-actions-key-2025-SmL72KtB5WzgVbU"

echo "📝 Setting Claude MCP API Key..."
supabase secrets set --project-ref $PROJECT_REF CLAUDE_MCP_API_KEY="claude-mcp-key-2025-Bxs88vt8aQ7uG3VrREyNQbfHb"

echo "✅ Environment variables set successfully!"
echo ""
echo "🔍 Verify the secrets were set:"
supabase secrets list --project-ref $PROJECT_REF

echo ""
echo "🚀 Your edge functions are now ready to use with full AI capabilities!"
echo ""
echo "📋 Next steps:"
echo "1. Test the AI functions with real API calls"
echo "2. Update ChatGPT Actions to use the new endpoints"
echo "3. Monitor performance and usage"
echo ""
echo "🛡️  This script is now SAFE - it validates API keys before setting them!"