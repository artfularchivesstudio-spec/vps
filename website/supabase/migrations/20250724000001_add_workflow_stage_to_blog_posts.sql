-- Add workflow_stage column to blog_posts table
-- Date: 2025-07-24
-- Purpose: Add workflow tracking for blog posts publishing pipeline

-- Create workflow stage enum (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_stage') THEN
        CREATE TYPE workflow_stage AS ENUM ('draft', 'review', 'translation', 'audio', 'published');
    END IF;
END $$;

-- Add workflow_stage column to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS workflow_stage workflow_stage DEFAULT 'draft';

-- Add languages column for multilingual support
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Add completed_languages column to track translation progress
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS completed_languages TEXT[] DEFAULT '{}';

-- Update existing posts to have default workflow stage
UPDATE public.blog_posts 
SET workflow_stage = 
  CASE 
    WHEN status = 'published' THEN 'published'::workflow_stage
    ELSE 'draft'::workflow_stage
  END
WHERE workflow_stage IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_workflow_stage ON public.blog_posts(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_workflow ON public.blog_posts(status, workflow_stage); 