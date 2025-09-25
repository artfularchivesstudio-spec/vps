-- Initial AI Blog Creation Schema Migration
-- Date: 2025-01-06
-- Purpose: Create future-proof schema for AI-powered blog creation with optional relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums conditionally to handle existing types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'super_admin', 'editor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origin_source') THEN
        CREATE TYPE origin_source AS ENUM ('manual', 'openai', 'claude', 'merged', 'generated', 'uploaded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('audio', 'video', 'image', 'document');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM ('blog_post', 'media_asset');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type') THEN
        CREATE TYPE session_type AS ENUM ('blog_content', 'audio_tts', 'video_generation');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'selection_type') THEN
        CREATE TYPE selection_type AS ENUM ('openai', 'claude', 'custom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_status') THEN
        CREATE TYPE media_status AS ENUM ('processing', 'ready', 'failed', 'archived');
    END IF;
END $$;

-- Admin users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'admin',
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts (Strapi-ready structure)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status content_status DEFAULT 'draft',
  origin_source origin_source DEFAULT 'manual',
  revision_number INTEGER DEFAULT 1,
  
  -- Optional FK to audio (nullable for posts without audio)
  primary_audio_id UUID, -- Will be FK after media_assets table creation
  
  -- Standard CMS fields
  created_by UUID REFERENCES admin_profiles(id),
  last_edited_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Extensible media assets (audio, video, images, documents)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type media_type NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER, -- for audio/video
  width INTEGER, -- for images/video
  height INTEGER, -- for images/video
  transcript TEXT, -- for audio/video
  alt_text TEXT, -- for images
  
  -- Generation metadata
  origin_source origin_source DEFAULT 'uploaded',
  generation_provider TEXT, -- openai, elevenlabs, etc.
  generation_settings JSONB,
  
  -- Optional FK to blog post (nullable for standalone assets)
  related_post_id UUID REFERENCES blog_posts(id),
  
  -- Status and workflow
  status media_status DEFAULT 'processing',
  
  -- Standard CMS fields
  created_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the FK constraint for blog_posts.primary_audio_id now that media_assets exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_posts_primary_audio') THEN
        ALTER TABLE blog_posts
        ADD CONSTRAINT fk_blog_posts_primary_audio
        FOREIGN KEY (primary_audio_id) REFERENCES media_assets(id);
    END IF;
END $$;

-- Revision tracking (unified for all content types)
CREATE TABLE IF NOT EXISTS content_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type content_type NOT NULL,
  content_id UUID NOT NULL, -- FK to blog_posts.id OR media_assets.id
  revision_number INTEGER NOT NULL,
  content_snapshot JSONB NOT NULL, -- store full content state
  change_summary TEXT,
  edited_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation sessions (AI workflow tracking)
CREATE TABLE IF NOT EXISTS generation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_type session_type NOT NULL,
  
  -- For blog generation
  blog_post_id UUID REFERENCES blog_posts(id),
  source_image_url TEXT,
  user_prompt TEXT,
  system_prompt TEXT,
  
  -- AI responses (flexible structure)
  ai_responses JSONB, -- { openai: {...}, claude: {...}, selected: "openai" }
  
  -- For media generation
  media_asset_id UUID REFERENCES media_assets(id),
  source_content TEXT, -- text for TTS, script for video, etc.
  generation_settings JSONB,
  
  -- Resource tracking
  tokens_used JSONB, -- { openai: 1500, claude: 800 }
  generation_time_ms INTEGER,
  cost_estimate DECIMAL(10,4),
  
  created_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flexible categorization (Strapi-compatible)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content_types TEXT[] DEFAULT ARRAY['blog_post'], -- extensible array
  parent_id UUID REFERENCES categories(id), -- hierarchical
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: Posts ↔ Categories
CREATE TABLE IF NOT EXISTS post_categories (
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, category_id)
);

-- Many-to-many: Media ↔ Categories
CREATE TABLE IF NOT EXISTS media_categories (
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (media_asset_id, category_id)
);

-- Flexible tagging system
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universal tagging (any content type)
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content_id UUID NOT NULL, -- FK to respective table
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Future extension: Video-specific metadata
CREATE TABLE IF NOT EXISTS video_metadata (
  media_asset_id UUID PRIMARY KEY REFERENCES media_assets(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  chapters JSONB, -- [{ title, start_time, end_time }]
  subtitles JSONB, -- [{ language, file_url }]
  quality_variants JSONB, -- [{ resolution, bitrate, url }]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by ON blog_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_assets_file_type ON media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_by ON media_assets(created_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_related_post ON media_assets(related_post_id);

CREATE INDEX IF NOT EXISTS idx_content_revisions_content ON content_revisions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_blog_post ON generation_sessions(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_media_asset ON generation_sessions(media_asset_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_content_tags_content ON content_tags(content_type, content_id);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_metadata ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (admin users can access everything for now)
-- More granular policies can be added later

-- Create policies conditionally to avoid conflicts
DO $$
BEGIN
    -- Admin profiles: Users can only see their own profile, super_admins can see all
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON admin_profiles FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'Super admins can view all profiles') THEN
        CREATE POLICY "Super admins can view all profiles" ON admin_profiles FOR SELECT USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND role = 'super_admin')
        );
    END IF;

    -- Blog posts: Admin users can manage all posts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Admin users can manage blog posts') THEN
        CREATE POLICY "Admin users can manage blog posts" ON blog_posts FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    -- Media assets: Admin users can manage all media
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'Admin users can manage media assets') THEN
        CREATE POLICY "Admin users can manage media assets" ON media_assets FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    -- Other tables: Admin access only
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_revisions' AND policyname = 'Admin access to content revisions') THEN
        CREATE POLICY "Admin access to content revisions" ON content_revisions FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generation_sessions' AND policyname = 'Admin access to generation sessions') THEN
        CREATE POLICY "Admin access to generation sessions" ON generation_sessions FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Create remaining policies conditionally
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admin access to categories') THEN
        CREATE POLICY "Admin access to categories" ON categories FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_categories' AND policyname = 'Admin access to post categories') THEN
        CREATE POLICY "Admin access to post categories" ON post_categories FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_categories' AND policyname = 'Admin access to media categories') THEN
        CREATE POLICY "Admin access to media categories" ON media_categories FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Admin access to tags') THEN
        CREATE POLICY "Admin access to tags" ON tags FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_tags' AND policyname = 'Admin access to content tags') THEN
        CREATE POLICY "Admin access to content tags" ON content_tags FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_metadata' AND policyname = 'Admin access to video metadata') THEN
        CREATE POLICY "Admin access to video metadata" ON video_metadata FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Create updated_at triggers conditionally
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers conditionally to avoid conflicts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_profiles_updated_at') THEN
        CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_posts_updated_at') THEN
        CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_media_assets_updated_at') THEN
        CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;