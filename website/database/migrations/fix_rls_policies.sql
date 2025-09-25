-- Direct RLS Policy Fix Script
-- Run this directly against the database to fix all RLS performance issues

-- Force drop and recreate ALL policies with guaranteed optimization

-- Blog Posts - All policies
DROP POLICY IF EXISTS "Admin users can read blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can delete blog posts" ON public.blog_posts;

CREATE POLICY "Admin users can read blog posts" ON public.blog_posts
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin users can insert blog posts" ON public.blog_posts
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin users can update blog posts" ON public.blog_posts
    FOR UPDATE USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin users can delete blog posts" ON public.blog_posts
    FOR DELETE USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Admin Profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON public.admin_profiles;

CREATE POLICY "Users can manage own profile" ON public.admin_profiles
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') = email
    );

-- Content Revisions
DROP POLICY IF EXISTS "Admin access to content revisions" ON public.content_revisions;

CREATE POLICY "Admin access to content revisions" ON public.content_revisions
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Generation Sessions
DROP POLICY IF EXISTS "Admin access to generation sessions" ON public.generation_sessions;

CREATE POLICY "Admin access to generation sessions" ON public.generation_sessions
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Categories
DROP POLICY IF EXISTS "Admin access to categories" ON public.categories;

CREATE POLICY "Admin access to categories" ON public.categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Post Categories
DROP POLICY IF EXISTS "Admin access to post categories" ON public.post_categories;

CREATE POLICY "Admin access to post categories" ON public.post_categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Media Categories
DROP POLICY IF EXISTS "Admin access to media categories" ON public.media_categories;

CREATE POLICY "Admin access to media categories" ON public.media_categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Tags
DROP POLICY IF EXISTS "Admin access to tags" ON public.tags;

CREATE POLICY "Admin access to tags" ON public.tags
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Content Tags
DROP POLICY IF EXISTS "Admin access to content tags" ON public.content_tags;

CREATE POLICY "Admin access to content tags" ON public.content_tags
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Video Metadata
DROP POLICY IF EXISTS "Admin access to video metadata" ON public.video_metadata;

CREATE POLICY "Admin access to video metadata" ON public.video_metadata
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Error Logs
DROP POLICY IF EXISTS "Admin users can view all error logs" ON public.error_logs;

CREATE POLICY "Admin users can view all error logs" ON public.error_logs
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- API Usage
DROP POLICY IF EXISTS "Admin users can view all API usage" ON public.api_usage;

CREATE POLICY "Admin users can view all API usage" ON public.api_usage
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- System Metrics
DROP POLICY IF EXISTS "Admin users can view system metrics" ON public.system_metrics;

CREATE POLICY "Admin users can view system metrics" ON public.system_metrics
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Media Assets
DROP POLICY IF EXISTS "Admin users can manage media assets" ON public.media_assets;

CREATE POLICY "Admin users can manage media assets" ON public.media_assets
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Add comprehensive comments for all policies
COMMENT ON POLICY "Admin users can read blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can insert blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can update blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can delete blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Users can manage own profile" ON public.admin_profiles IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to content revisions" ON public.content_revisions IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to generation sessions" ON public.generation_sessions IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to categories" ON public.categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to post categories" ON public.post_categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to media categories" ON public.media_categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to tags" ON public.tags IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to content tags" ON public.content_tags IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin access to video metadata" ON public.video_metadata IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can view all error logs" ON public.error_logs IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can view all API usage" ON public.api_usage IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can view system metrics" ON public.system_metrics IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can manage media assets" ON public.media_assets IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row'; 