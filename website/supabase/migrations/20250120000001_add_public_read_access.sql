-- Migration: Add public read access for published blog posts
-- This allows anyone to read published blog posts without authentication

-- Add a policy for public read access to published blog posts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read published blog posts' AND tablename = 'blog_posts') THEN
        CREATE POLICY "Public can read published blog posts" ON public.blog_posts
            FOR SELECT USING (
                status = 'published'
            );
    END IF;

    -- Add a comment explaining the policy
    COMMENT ON POLICY "Public can read published blog posts" ON public.blog_posts IS 'Allows public access to read published blog posts without authentication';
END $$;