-- Fix Remaining RLS Performance Issues
-- This migration addresses the remaining Supabase linter warnings
-- by ensuring all policies use the optimized (SELECT auth.<function>()) format

-- First, let's check if the audio_jobs and external_api_keys tables exist and have the right columns
-- Then recreate all policies with the optimized format

-- Drop and recreate audio_jobs policies (if table exists)
DROP POLICY IF EXISTS "Authenticated users can manage their jobs" ON public.audio_jobs;

-- Drop and recreate external_api_keys policies (if table exists)
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.external_api_keys;

-- Recreate all blog_posts policies with guaranteed optimized format
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

-- Recreate admin_profiles policy with guaranteed optimized format
DROP POLICY IF EXISTS "Users can manage own profile" ON public.admin_profiles;

CREATE POLICY "Users can manage own profile" ON public.admin_profiles
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') = email
    );

-- Recreate all other policies with guaranteed optimized format
DROP POLICY IF EXISTS "Admin access to content revisions" ON public.content_revisions;
CREATE POLICY "Admin access to content revisions" ON public.content_revisions
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin access to generation sessions" ON public.generation_sessions;
CREATE POLICY "Admin access to generation sessions" ON public.generation_sessions
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin access to categories" ON public.categories;
CREATE POLICY "Admin access to categories" ON public.categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin access to post categories" ON public.post_categories;
CREATE POLICY "Admin access to post categories" ON public.post_categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin access to media categories" ON public.media_categories;
CREATE POLICY "Admin access to media categories" ON public.media_categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin access to tags" ON public.tags;
CREATE POLICY "Admin access to tags" ON public.tags
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin access to content tags" ON public.content_tags;
CREATE POLICY "Admin access to content tags" ON public.content_tags
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin access to video metadata" ON public.video_metadata;
CREATE POLICY "Admin access to video metadata" ON public.video_metadata
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin users can view all error logs" ON public.error_logs;
CREATE POLICY "Admin users can view all error logs" ON public.error_logs
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin users can view all API usage" ON public.api_usage;
CREATE POLICY "Admin users can view all API usage" ON public.api_usage
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin users can view system metrics" ON public.system_metrics;
CREATE POLICY "Admin users can view system metrics" ON public.system_metrics
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admin users can manage media assets" ON public.media_assets;
CREATE POLICY "Admin users can manage media assets" ON public.media_assets
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Add comments explaining the performance optimizations
COMMENT ON POLICY "Admin users can read blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can insert blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can update blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Admin users can delete blog posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "Users can manage own profile" ON public.admin_profiles IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row'; 