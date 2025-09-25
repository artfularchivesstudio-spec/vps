# AI-Powered Blog Creation Feature Architecture

**Planning Date**: January 6, 2025  
**Status**: Architecture Complete - Ready for Implementation  
**Priority**: High  

## Overview
Build an admin interface for creating blog posts from artwork images using dual AI analysis (OpenAI vs Claude), with optional audio generation and extensible media asset architecture. Designed for future Strapi migration and video content expansion.

## Tech Stack Integration
- **Database**: Supabase (PostgreSQL) → Future Strapi migration
- **Deployment**: Vercel (seamless integration)
- **AI APIs**: OpenAI GPT-4 Vision + Claude 3.5 Sonnet
- **TTS**: OpenAI TTS or ElevenLabs API
- **File Storage**: Supabase Storage → Future Strapi Media Library

## Phase 1: Foundation & Future-Proof Architecture

### 1.1 Supabase Setup
- PostgreSQL database with migration-friendly schema
- Authentication system (compatible with Strapi auth)
- Storage buckets: `images`, `audio`, `video`, `documents`
- API policies designed for easy CMS migration

### 1.2 Future-Proof Database Schema
```sql
-- Admin users (Strapi-compatible structure)
admin_profiles (
  id: uuid PRIMARY KEY
  email: text UNIQUE
  role: text (admin, super_admin, editor)
  first_name: text
  last_name: text
  avatar_url: text
  created_at: timestamp
  updated_at: timestamp
)

-- Blog posts (Strapi-ready structure)
blog_posts (
  id: uuid PRIMARY KEY
  title: text NOT NULL
  slug: text UNIQUE NOT NULL
  excerpt: text
  content: text
  featured_image_url: text
  seo_title: text
  seo_description: text
  status: enum (draft, published, archived) DEFAULT 'draft'
  origin_source: enum (manual, openai, claude, merged) DEFAULT 'manual'
  revision_number: integer DEFAULT 1
  
  -- Optional FK to audio (nullable for posts without audio)
  primary_audio_id: uuid (FK to media_assets.id, nullable)
  
  -- Standard CMS fields
  created_by: uuid (FK to admin_profiles.id)
  last_edited_by: uuid (FK to admin_profiles.id)
  created_at: timestamp DEFAULT now()
  updated_at: timestamp DEFAULT now()
  published_at: timestamp
)

-- Extensible media assets (audio, video, images, documents)
media_assets (
  id: uuid PRIMARY KEY
  title: text NOT NULL
  description: text
  file_url: text NOT NULL
  file_type: enum (audio, video, image, document)
  mime_type: text
  file_size_bytes: bigint
  duration_seconds: integer -- for audio/video
  width: integer -- for images/video
  height: integer -- for images/video
  transcript: text -- for audio/video
  alt_text: text -- for images
  
  -- Generation metadata
  origin_source: enum (generated, uploaded, manual)
  generation_provider: text -- openai, elevenlabs, etc.
  generation_settings: jsonb
  
  -- Optional FK to blog post (nullable for standalone assets)
  related_post_id: uuid (FK to blog_posts.id, nullable)
  
  -- Status and workflow
  status: enum (processing, ready, failed, archived) DEFAULT 'processing'
  
  -- Standard CMS fields
  created_by: uuid (FK to admin_profiles.id)
  created_at: timestamp DEFAULT now()
  updated_at: timestamp DEFAULT now()
)

-- Revision tracking (unified for all content types)
content_revisions (
  id: uuid PRIMARY KEY
  content_type: enum (blog_post, media_asset)
  content_id: uuid -- FK to blog_posts.id OR media_assets.id
  revision_number: integer
  content_snapshot: jsonb -- store full content state
  change_summary: text
  edited_by: uuid (FK to admin_profiles.id)
  created_at: timestamp DEFAULT now()
)

-- Generation sessions (AI workflow tracking)
generation_sessions (
  id: uuid PRIMARY KEY
  session_type: enum (blog_content, audio_tts, video_generation) -- extensible
  
  -- For blog generation
  blog_post_id: uuid (FK to blog_posts.id, nullable)
  source_image_url: text
  user_prompt: text
  system_prompt: text
  
  -- AI responses (flexible structure)
  ai_responses: jsonb -- { openai: {...}, claude: {...}, selected: "openai" }
  
  -- For media generation
  media_asset_id: uuid (FK to media_assets.id, nullable)
  source_content: text -- text for TTS, script for video, etc.
  generation_settings: jsonb
  
  -- Resource tracking
  tokens_used: jsonb -- { openai: 1500, claude: 800 }
  generation_time_ms: integer
  cost_estimate: decimal(10,4)
  
  created_by: uuid (FK to admin_profiles.id)
  created_at: timestamp DEFAULT now()
)

-- Flexible categorization (Strapi-compatible)
categories (
  id: uuid PRIMARY KEY
  name: text UNIQUE NOT NULL
  slug: text UNIQUE NOT NULL
  description: text
  content_types: text[] DEFAULT ['blog_post'] -- extensible array
  parent_id: uuid (FK to categories.id, nullable) -- hierarchical
  sort_order: integer DEFAULT 0
  created_at: timestamp DEFAULT now()
  updated_at: timestamp DEFAULT now()
)

-- Many-to-many: Posts ↔ Categories
post_categories (
  blog_post_id: uuid (FK to blog_posts.id)
  category_id: uuid (FK to categories.id)
  PRIMARY KEY (blog_post_id, category_id)
)

-- Many-to-many: Media ↔ Categories  
media_categories (
  media_asset_id: uuid (FK to media_assets.id)
  category_id: uuid (FK to categories.id)
  PRIMARY KEY (media_asset_id, category_id)
)

-- Flexible tagging system
tags (
  id: uuid PRIMARY KEY
  name: text UNIQUE NOT NULL
  slug: text UNIQUE NOT NULL
  usage_count: integer DEFAULT 0
  created_at: timestamp DEFAULT now()
)

-- Universal tagging (any content type)
content_tags (
  id: uuid PRIMARY KEY
  tag_id: uuid (FK to tags.id)
  content_type: enum (blog_post, media_asset)
  content_id: uuid -- FK to respective table
  created_at: timestamp DEFAULT now()
)

-- Future extension: Video-specific metadata
video_metadata (
  media_asset_id: uuid (FK to media_assets.id)
  thumbnail_url: text
  chapters: jsonb -- [{ title, start_time, end_time }]
  subtitles: jsonb -- [{ language, file_url }]
  quality_variants: jsonb -- [{ resolution, bitrate, url }]
  created_at: timestamp DEFAULT now()
)
```

### 1.3 API Architecture (Strapi-Compatible)
```typescript
// REST API structure matching Strapi conventions
/api/blog-posts
/api/media-assets  
/api/categories
/api/tags
/api/generation-sessions

// GraphQL ready (future Strapi migration)
/graphql

// Admin-specific endpoints
/api/admin/dashboard
/api/admin/analytics
/api/admin/bulk-operations
```

## Phase 2: Content Creation Workflow

### 2.1 Blog Post Creation
```typescript
// 1. Create blog post (minimal required fields)
const post = await createBlogPost({
  title: "AI Generated Art Analysis",
  status: "draft",
  origin_source: "openai" // or "claude", "merged"
});

// 2. Optional: Generate audio
const audio = await generateAudio({
  source_text: post.content,
  voice_settings: {...}
});

// 3. Link audio to post (optional)
await updateBlogPost(post.id, {
  primary_audio_id: audio.id
});

// 4. Update related post reference in audio
await updateMediaAsset(audio.id, {
  related_post_id: post.id
});
```

### 2.2 Standalone Audio Creation
```typescript
// Create audio without post relationship
const audio = await createMediaAsset({
  title: "Art Commentary #1", 
  file_type: "audio",
  origin_source: "generated",
  related_post_id: null // explicitly nullable
});
```

## Phase 3: User Interface

### 3.1 Post Creation Flow (`/admin/posts/create`)
1. **Basic Info**: Title, slug (auto-generated)
2. **AI Generation** (optional): Image analysis → content
3. **Content Editing**: Rich text with revision tracking
4. **Audio Generation** (optional): 
   - Generate from post content
   - Link existing audio
   - Skip audio entirely
5. **Publishing**: Categories, tags, SEO, status

### 3.2 Media Management (`/admin/media`)
- Universal media library (audio, images, future video)
- Filter by type, status, relationship to posts
- Bulk operations and organization
- Preview and metadata editing

### 3.3 Relationship Management
- Posts can reference one primary audio (optional FK)
- Audio can reference one related post (optional FK)
- Visual relationship indicators in UI
- Easy linking/unlinking tools

## Phase 4: Migration & Extension Strategy

### 4.1 Strapi Migration Readiness
```typescript
// Database schema maps directly to Strapi collection types
blog_posts → Blog Post collection
media_assets → Media Library (extended)
categories → Category collection
tags → Tag collection
admin_profiles → User collection

// API endpoints use Strapi-compatible patterns
// GraphQL schema ready for Strapi integration
// File storage can migrate to Strapi Media Library
```

### 4.2 Video Extension (Future)
```sql
-- Already supported in media_assets table
INSERT INTO media_assets (
  title: "Art Process Video",
  file_type: "video", -- enum already includes video
  mime_type: "video/mp4",
  duration_seconds: 180,
  width: 1920,
  height: 1080
);

-- Video-specific metadata via video_metadata table
-- Thumbnail generation workflows
-- Chapter/subtitle management
```

### 4.3 Extensibility Features
- **Custom Fields**: JSONB columns for flexible metadata
- **Workflow States**: Extensible status enums
- **Provider Agnostic**: Generation settings stored as JSON
- **Multi-tenant Ready**: User-scoped data with RLS
- **API Versioning**: Future-proof endpoint structure

## Phase 5: Implementation Priorities

### 5.1 MVP (Phase 1)
- Blog post creation with optional audio FK
- AI content generation (OpenAI + Claude)
- Basic audio TTS generation
- Simple admin interface

### 5.2 Enhanced (Phase 2)  
- Rich text editing with revisions
- Media library management
- Category and tag organization
- Bulk operations

### 5.3 Advanced (Phase 3)
- Video support infrastructure
- Advanced AI prompt management
- Analytics and reporting
- Strapi migration tools

## Key Architectural Decisions

### Optional Relationships
- `blog_posts.primary_audio_id` nullable FK
- `media_assets.related_post_id` nullable FK
- Both can exist independently
- Clear relationship semantics

### Future-Proof Design
- Extensible enums for content types
- JSONB for flexible metadata
- Universal tagging and categorization
- Provider-agnostic generation tracking

### Strapi Compatibility
- Collection-style table naming
- Standard CMS field patterns
- API structure matching Strapi conventions
- Easy migration path for data and workflows

## Implementation Next Steps

1. **Supabase Project Setup**
   ```bash
   supabase projects create artful-archives-ai
   supabase init
   supabase db start
   ```

2. **Database Migration**
   - Create migration files for schema
   - Set up RLS policies
   - Configure storage buckets

3. **Dependencies Installation**
   ```json
   {
     "@supabase/supabase-js": "^2.x",
     "@supabase/auth-helpers-nextjs": "^0.x",
     "openai": "^4.x",
     "@anthropic-ai/sdk": "^0.x",
     "sharp": "^0.x",
     "react-dropzone": "^14.x",
     "@tiptap/react": "^2.x"
   }
   ```

4. **Environment Configuration**
   - Supabase URL and anon key
   - OpenAI API key
   - Anthropic API key
   - Storage bucket configuration

This architecture supports the current workflow while being ready for CMS migration and media type expansion. The optional FK relationships provide the flexibility needed while maintaining data integrity and clear semantics.