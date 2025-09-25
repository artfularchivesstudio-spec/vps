# Image Analysis Architecture - DRY Implementation

## Overview

We've successfully eliminated code duplication across multiple image analysis implementations by creating a unified, shared service. This document explains the architecture and how to use each endpoint.

## Shared Service

**Location**: `src/lib/ai/image-analysis.ts`

This is the core service that contains all the image analysis logic:

- **OpenAI Analysis**: Uses GPT-4o for detailed artwork analysis
- **Claude Analysis**: Uses Claude 3.5 Sonnet for artistic expertise
- **Unified Interface**: Single function `analyzeImage()` that handles both providers
- **Flexible Input**: Supports both image URLs and base64 data URLs
- **Multiple Analysis Types**: brief, detailed, technical, creative
- **Smart Suggestions**: Auto-generates titles, slugs, categories, and tags

## API Endpoints

### 1. Internal Admin API
**Route**: `POST /api/ai/analyze-image`
**Use Case**: Admin interface for creating blog posts
**Input**: FormData with image file
**Output**: OpenAI and Claude analysis with suggestions

```typescript
const formData = new FormData()
formData.append('image', file)
formData.append('title', 'My Artwork')

const response = await fetch('/api/ai/analyze-image', {
  method: 'POST',
  body: formData
})
```

### 2. External API (Authenticated)
**Route**: `POST /api/external/ai/analyze-image`
**Use Case**: External integrations, ChatGPT actions
**Input**: JSON with base64 image data
**Output**: Analysis with rate limiting info

```typescript
const response = await fetch('/api/external/ai/analyze-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_data: 'data:image/jpeg;base64,/9j/4AAQ...',
    analysis_type: 'detailed',
    providers: ['openai', 'claude']
  })
})
```

### 3. Unified Upload + Analysis API
**Route**: `POST /api/analyze`
**Use Case**: Complete workflow - upload to storage, then analyze
**Input**: FormData with image file
**Output**: Analysis + storage info

```typescript
const formData = new FormData()
formData.append('image', file)
formData.append('title', 'My Artwork')
formData.append('providers', 'openai,claude')
formData.append('analysis_type', 'detailed')

const response = await fetch('/api/analyze', {
  method: 'POST',
  body: formData
})
```

### 4. Supabase Edge Function
**Route**: `POST /functions/v1/ai-analyze-image-simple`
**Use Case**: Serverless image analysis
**Input**: JSON with image URL
**Output**: Analysis with optional storage

```typescript
const response = await fetch('https://your-project.supabase.co/functions/v1/ai-analyze-image-simple', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_url: 'https://example.com/image.jpg',
    save_to_storage: true,
    providers: ['openai', 'claude']
  })
})
```

## Key Benefits of DRY Architecture

### 1. **Single Source of Truth**
- All analysis logic is in one place (`src/lib/ai/image-analysis.ts`)
- Consistent prompts and analysis types across all endpoints
- Easy to maintain and update

### 2. **Flexible Deployment**
- Next.js API routes for server-side rendering
- Supabase Edge Functions for serverless scalability
- External API for third-party integrations

### 3. **Consistent Results**
- Same analysis quality regardless of endpoint
- Unified error handling and response format
- Shared suggestion generation logic

### 4. **Easy Testing**
- Test the shared service once
- All endpoints automatically benefit from improvements
- Consistent behavior across environments

## Usage Recommendations

### For Admin Interface
Use `/api/ai/analyze-image` - direct file upload, immediate response

### For External Integrations
Use `/api/external/ai/analyze-image` - authenticated, rate-limited

### For Complete Workflow
Use `/api/analyze` - uploads to storage, then analyzes

### For Serverless
Use the Supabase Edge Function directly - no Next.js dependency

## Environment Variables

All endpoints require these environment variables:

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INTERNAL_API_KEY=your_internal_key  # Optional, falls back to service role key
```

## Migration Guide

If you were using the old duplicated implementations:

1. **Old**: Direct OpenAI/Claude calls in each endpoint
2. **New**: Import and use `analyzeImage()` from shared service

```typescript
// Old way (duplicated)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const response = await openai.chat.completions.create({...})

// New way (DRY)
import { analyzeImage } from '@/lib/ai/image-analysis'
const result = await analyzeImage({ imageUrl, providers: ['openai'] })
```

## Future Enhancements

- Add support for more AI providers (Gemini, etc.)
- Implement caching for repeated analyses
- Add batch processing capabilities
- Create analysis templates for different art styles
- Add image preprocessing (resize, optimize) before analysis 