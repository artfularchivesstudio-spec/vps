# Supabase Edge Functions Mapping for ChatGPT Actions

This document maps all Supabase Edge Functions to their corresponding OpenAPI paths for the ChatGPT Actions integration. This serves as the canonical reference for the migration from Vercel proxy to direct Supabase Edge Functions.

## Function Mapping

| OpenAPI Path (Current) | Supabase Function Slug | Mapped Path (New) | Description |
|------------------------|------------------------|-------------------|-------------|
| `/api/external/posts` | `posts-simple` | `/posts-simple` | Handles blog post CRUD operations |
| `/api/external/ai/analyze-image` | `ai-analyze-image` | `/ai-analyze-image` | AI-powered image analysis |
| `/api/external/ai/generate-audio` | `ai-generate-audio-simple` | `/ai-generate-audio-simple` | Text-to-speech generation |
| `/api/audio-job-status/{job_id}` | `audio-job-status` | `/audio-job-status/{job_id}` | Audio job status checks |
| `/api/audio-job-submit` | `audio-job-submit` | `/audio-job-submit` | Submit audio generation jobs |
| `/api/audio-job-update` | `audio-job-update` | `/audio-job-update` | Update audio job metadata |
| `/api/sample-voice` | `sample-voice` | `/sample-voice` | Voice sample generation |
| `/api/generate-blog-content` | `generate-blog-content` | `/generate-blog-content` | AI blog content generation |
| `/api/debug-env` | `debug-env` | `/debug-env` | Environment debugging endpoint |

## Migration Notes

1. **Path Transformation**: All paths are simplified by removing the `/api/external/` prefix and mapping directly to function slugs
2. **Parameter Handling**: Path parameters (like `{job_id}`) remain in the same position
3. **Authentication**: All endpoints now require Bearer token authentication via `Authorization` header
4. **Removed Parameters**: Vercel-specific query parameters (`x-vercel-protection-bypass`, `x-vercel-set-bypass-cookie`) are no longer needed
5. **Base URL Change**: 
   - Old: `https://artful-archives-website-gsinghdevs-projects.vercel.app`
   - New: `https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1`

## Verification Checklist

- [ ] All function slugs match OpenAPI paths after migration
- [ ] Path parameters are correctly preserved in new mappings
- [ ] No Vercel-specific parameters remain in OpenAPI spec
- [ ] Authentication requirements are consistent across all endpoints
- [ ] Base URL updated in all configuration files
- [ ] Test coverage exists for all mapped endpoints

## Example Transformation

**Before (Vercel Proxy):**
```
GET https://artful-archives-website-gsinghdevs-projects.vercel.app/api/external/posts?limit=10&page=1&x-vercel-protection-bypass=fKQC3EoDUl9tRGeryBtrR3xr5MwL3OR9&x-vercel-set-bypass-cookie=true
```

**After (Direct Supabase):**
```
GET https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple?limit=10&page=1
Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU
```

## Next Steps

1. Update `openapi-chatgpt-actions.yaml` with new mappings
2. Remove all Vercel-specific parameters from OpenAPI spec
3. Add emoji-based logging to all edge functions
4. Update authentication middleware to enforce Bearer token
5. Validate all endpoints with new configuration