-- Migration: Fix blog posts public access
-- This ensures that blog posts are publicly accessible while maintaining RLS

-- First, ensure RLS is enabled on blog_posts table
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    -- Drop the policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read published blog posts' AND tablename = 'blog_posts') THEN
        DROP POLICY "Public can read published blog posts" ON public.blog_posts;
    END IF;
    
    -- Drop any other conflicting policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users' AND tablename = 'blog_posts') THEN
        DROP POLICY "Enable read access for all users" ON public.blog_posts;
    END IF;
END $$;

-- Create a comprehensive policy for public read access
CREATE POLICY "Public can read published blog posts" 
    ON public.blog_posts
    FOR SELECT 
    USING (status = 'published');

-- Create policy for authenticated users to read all blog posts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read all blog posts' AND tablename = 'blog_posts') THEN
        CREATE POLICY "Authenticated users can read all blog posts" 
            ON public.blog_posts
            FOR SELECT 
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Add comments explaining the policies
COMMENT ON POLICY "Public can read published blog posts" ON public.blog_posts 
    IS 'Allows public access to read published blog posts without authentication';

COMMENT ON POLICY "Authenticated users can read all blog posts" ON public.blog_posts 
    IS 'Allows authenticated users to read all blog posts regardless of status';