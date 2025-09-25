-- Add primary_audio_id to blog_posts table and set up foreign key relationship

-- Step 1: Add the primary_audio_id column to the blog_posts table
-- This column will store a UUID that references the media_assets table.
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS primary_audio_id UUID;

-- Step 2: Add a foreign key constraint to the primary_audio_id column (idempotent)
-- This ensures that every value in primary_audio_id corresponds to a valid record in media_assets.
-- ON DELETE SET NULL means that if a media asset is deleted, the corresponding
-- primary_audio_id in blog_posts will be set to NULL, preventing broken links.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_primary_audio_id') THEN
        ALTER TABLE public.blog_posts
        ADD CONSTRAINT fk_primary_audio_id
        FOREIGN KEY (primary_audio_id)
        REFERENCES public.media_assets(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Create an index on the new column
-- This will improve the performance of queries that join blog_posts and media_assets.
CREATE INDEX IF NOT EXISTS idx_blog_posts_primary_audio_id
ON public.blog_posts(primary_audio_id);

-- Final check: Verify that the column and constraint have been added
-- (This is for manual verification and not part of the executed script)
-- \d public.blog_posts
