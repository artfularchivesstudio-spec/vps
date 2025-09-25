# 🚀 Artful Archives Setup Guide

## Step 1: Get Your API Keys

### 1. Supabase Database
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection String
4. Copy the connection string (it starts with `postgresql://`)

### 2. OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add payment method
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 3. Anthropic Claude API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 4. ElevenLabs API Key (Optional - for audio generation)
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Create an account
3. Go to Profile > API Keys
4. Copy your API key

## Step 2: Set Environment Variables in Vercel

Run these commands in your terminal:

```bash
# Database
vercel env add DATABASE_URL
# Paste your Supabase connection string

vercel env add SUPABASE_URL
# Paste your Supabase project URL (https://your-project.supabase.co)

vercel env add SUPABASE_ANON_KEY
# Paste your Supabase anon key

# AI Services
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key

vercel env add ANTHROPIC_API_KEY
# Paste your Anthropic API key

vercel env add ELEVENLABS_API_KEY
# Paste your ElevenLabs API key (optional)

# Security
vercel env add EXTERNAL_API_SECRET
# Create a random secret: openssl rand -base64 32

vercel env add HOOKS_API_KEY
# Create another random secret: openssl rand -base64 32
```

## Step 3: Generate Random Secrets

Run these commands to generate secure secrets:

```bash
# Generate External API Secret
openssl rand -base64 32

# Generate Hooks API Key
openssl rand -base64 32
```

## Step 4: Redeploy

After setting all environment variables:

```bash
vercel --prod
```

## Step 5: Test the API

Your API will be available at:
- **Base URL**: https://artful-archives-website-gsinghdevs-projects.vercel.app
- **API Endpoints**: `/api/external/...`

## Next Steps

1. ✅ Set up all environment variables
2. ✅ Redeploy to Vercel
3. ✅ Generate API keys for ChatGPT Actions
4. ✅ Configure your Custom GPT
5. ✅ Test the integration

Need help? The system is ready to go once you have the API keys configured!
