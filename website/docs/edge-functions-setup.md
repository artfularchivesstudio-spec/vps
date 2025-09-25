# 🚀 Supabase Edge Functions Setup Guide

## Overview

We've migrated from Vercel API routes to Supabase Edge Functions for better performance, global distribution, and cost efficiency. This guide covers the complete setup process.

## 🎯 Benefits of Edge Functions

### ⚡ Performance
- **Faster Cold Starts**: Deno runtime is much lighter than Node.js
- **Global Distribution**: Runs closer to users worldwide
- **Lower Latency**: Edge computing reduces response times

### 💰 Cost Efficiency
- **Better Resource Usage**: More efficient than traditional serverless
- **Pay-per-execution**: No idle costs
- **Reduced Bandwidth**: Closer to users = less data transfer

### 🔧 Developer Experience
- **TypeScript Native**: Built-in TypeScript support
- **Web Standards**: Uses standard Web APIs
- **Simplified Deployment**: Direct integration with Supabase

## 📁 Edge Functions Structure

```
supabase/functions/
├── _shared/
│   └── cors.ts                 # Shared CORS configuration
├── posts/
│   └── index.ts               # Blog posts CRUD operations
├── ai-analyze-image/
│   └── index.ts               # AI image analysis (OpenAI + Claude)
└── ai-generate-audio/
    └── index.ts               # ElevenLabs audio generation
```

## 🛠 Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref [your-project-id]
```

### 4. Set Environment Variables

In your Supabase dashboard, go to **Settings > Edge Functions** and add:

```bash
OPENAI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_claude_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Deploy Functions

```bash
# Deploy all functions
./scripts/deploy-edge-functions.sh

# Or deploy individually
supabase functions deploy posts
supabase functions deploy ai-analyze-image
supabase functions deploy ai-generate-audio
```

## 🔗 API Endpoints

### Posts Management
```
GET  https://[project-id].supabase.co/functions/v1/posts
POST https://[project-id].supabase.co/functions/v1/posts
```

### AI Image Analysis
```
POST https://[project-id].supabase.co/functions/v1/ai-analyze-image
```

### Audio Generation
```
POST https://[project-id].supabase.co/functions/v1/ai-generate-audio
```

## 🔐 Authentication

All endpoints use the same API key authentication as before:

```bash
Authorization: Bearer your-api-key
```

## 📊 API Usage Examples

### Create a Blog Post

```bash
curl -X POST \
  https://[project-id].supabase.co/functions/v1/posts \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Art Blog Post",
    "content": "This is the content of my blog post...",
    "status": "draft",
    "categories": ["Modern Art", "Abstract"],
    "tags": ["painting", "contemporary"]
  }'
```

### Analyze an Image

```bash
curl -X POST \
  https://[project-id].supabase.co/functions/v1/ai-analyze-image \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/artwork.jpg",
    "providers": ["openai", "claude"],
    "save_to_storage": true,
    "title": "Artwork Analysis"
  }'
```

### Generate Audio

```bash
curl -X POST \
  https://[project-id].supabase.co/functions/v1/ai-generate-audio \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to our art gallery...",
    "voice_id": "EXAVITQu4vr4xnSDxMaL",
    "save_to_storage": true,
    "title": "Gallery Welcome Audio"
  }'
```

## 🚦 Migration Strategy

### Phase 1: Parallel Deployment
- ✅ Deploy edge functions alongside existing Vercel routes
- ✅ Test edge functions thoroughly
- ✅ Update API documentation

### Phase 2: Gradual Migration
- 🔄 Update ChatGPT Actions to use edge functions
- 🔄 Update internal applications
- 🔄 Monitor performance and reliability

### Phase 3: Complete Migration
- ⏳ Deprecate Vercel routes
- ⏳ Remove legacy API code
- ⏳ Update all documentation

## 🔍 Monitoring & Debugging

### View Function Logs
```bash
supabase functions logs posts
supabase functions logs ai-analyze-image
supabase functions logs ai-generate-audio
```

### Function Status
```bash
supabase functions list
```

### Local Development
```bash
# Start local development
supabase start

# Serve functions locally
supabase functions serve

# Test locally
curl -X POST \
  http://localhost:54321/functions/v1/posts \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Post"}'
```

## 🎛 Configuration Options

### CORS Settings
The `_shared/cors.ts` file configures CORS for all functions:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

### Rate Limiting
Rate limiting is handled at the API key level in the database. Each API key has:
- `rate_limit`: Maximum requests per minute
- Request tracking in `api_request_logs` table

### Error Handling
All functions use consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "data": null
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Function Not Found**
   - Check function name in deployment
   - Verify project linking

2. **Environment Variables Missing**
   - Set in Supabase dashboard
   - Redeploy functions after setting

3. **Authentication Errors**
   - Verify API key format
   - Check database API key records

4. **CORS Issues**
   - Verify CORS headers in shared config
   - Check browser network tab

### Performance Optimization

1. **Cold Start Reduction**
   - Functions stay warm with regular usage
   - Consider warming functions with cron jobs

2. **Memory Usage**
   - Edge functions have memory limits
   - Optimize large data processing

3. **Timeout Handling**
   - Default timeout is 60 seconds
   - Implement proper error handling

## 📈 Performance Comparison

| Metric | Vercel API Routes | Supabase Edge Functions |
|--------|------------------|-------------------------|
| Cold Start | 1-3 seconds | 100-300ms |
| Global Distribution | Limited | Worldwide |
| Memory Usage | 1024MB | 150MB |
| Execution Time | 10-30 seconds | 60 seconds |
| Cost | $$$ | $ |

## 🎉 Next Steps

1. **Deploy Functions**: Use the deployment script
2. **Test Endpoints**: Verify all functionality works
3. **Update ChatGPT Actions**: Point to new endpoints
4. **Monitor Performance**: Track metrics and logs
5. **Optimize**: Fine-tune based on usage patterns

## 📚 Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [Web API Standards](https://developer.mozilla.org/en-US/docs/Web/API)

---

**Ready to deploy?** Run `./scripts/deploy-edge-functions.sh` to get started! 🚀 