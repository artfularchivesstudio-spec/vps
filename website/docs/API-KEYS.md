# 🔐 API Keys for ChatGPT Actions

## Generated API Keys

### For ChatGPT Actions:
**API Key**: `chatgpt-actions-key-2025-SmL72KtB5WzgVbU`
**Base URL**: `https://artful-archives-website-gsinghdevs-projects.vercel.app`

### For Claude MCP:
**API Key**: `claude-mcp-key-2025-Bxs88vt8aQ7uG3VrREyNQbfHb`
**Base URL**: `https://artful-archives-website-gsinghdevs-projects.vercel.app`

## ChatGPT Actions Configuration

### Authentication Settings:
- **Authentication Type**: API Key
- **API Key**: `chatgpt-actions-key-2025-SmL72KtB5WzgVbU`
- **Auth Type**: Bearer Token
- **Header Name**: Authorization
- **Header Value* *: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU

### Security Features:
- **✅ Environment Variables**: API keys stored securely in Supabase environment
- **✅ No Hard-coded Keys**: Authentication keys are not exposed in source code
- **✅ Bearer Token Auth**: Standard OAuth 2.0 Bearer token authentication
- **✅ Request Validation**: All requests validated before processing

### API Endpoints:

**Supabase Edge Functions (Recommended):**
```
# Blog Posts Management
GET  https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple
POST https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple

# AI Image Analysis (Mirrors admin functionality)
POST https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/ai-analyze-image-simple

# AI Audio Generation (Mirrors admin functionality)
POST https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/ai-generate-audio-simple

# Debug & Health Check
GET  https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/debug-env
GET  https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/health-check
```

**Legacy Vercel Routes (Deprecated):**
```
POST /api/external/posts
GET /api/external/posts
POST /api/external/ai/analyze-image
POST /api/external/ai/generate-audio
```

## Quick Setup:

1. **Copy the API key**: `chatgpt-actions-key-2025-SmL72KtB5WzgVbU`
2. **Use Base URL**: `https://artful-archives-website-gsinghdevs-projects.vercel.app`
3. **Configure Authentication**: Bearer Token with the API key above
4. **Import Schema**: Use the OpenAPI specification from the docs folder

## Test with cURL:

**Test Supabase Edge Function:**
```bash
# Test the posts edge function
curl -X POST \
  https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts \
  -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post via Edge Function",
    "content": "This is a test post created via Supabase Edge Functions",
    "status": "draft"
  }'
```

**Test AI Image Analysis:**
```bash
# Test image analysis edge function
curl -X POST \
  https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/ai-analyze-image \
  -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "providers": ["openai", "claude"],
    "save_to_storage": true
  }'
```

**Test Audio Generation:**
```bash
# Test audio generation edge function
curl -X POST \
  https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/ai-generate-audio \
  -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to our art blog! This is a test audio generation.",
    "save_to_storage": true,
    "title": "Test Audio"
  }'
```

**Legacy Vercel Test:**
```bash
# Test the legacy API endpoint
curl -X POST \
  https://artful-archives-website-gsinghdevs-projects.vercel.app/api/external/posts \
  -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "This is a test post created via ChatGPT Actions",
    "status": "draft"
  }'
```
