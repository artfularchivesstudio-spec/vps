-- Add auto-save fields to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS auto_save_key TEXT,
ADD COLUMN IF NOT EXISTS is_auto_saved BOOLEAN DEFAULT FALSE;

-- Create index for faster auto-save lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_auto_save_key ON blog_posts(auto_save_key) WHERE auto_save_key IS NOT NULL;

-- Add status column if it doesn't exist
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));