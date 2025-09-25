-- Fix RLS Performance Issues
-- This migration addresses the Supabase linter warnings about:
-- 1. Auth RLS Initialization Plan: auth.<function>() calls being re-evaluated for each row
-- 2. Multiple Permissive Policies: Multiple policies for same role/action causing overhead

-- Drop existing RLS policies that need to be recreated with better performance
DROP POLICY IF EXISTS "Admin users can read blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Admin access to content revisions" ON public.content_revisions;
DROP POLICY IF EXISTS "Admin access to generation sessions" ON public.generation_sessions;
DROP POLICY IF EXISTS "Admin access to categories" ON public.categories;
DROP POLICY IF EXISTS "Admin access to post categories" ON public.post_categories;
DROP POLICY IF EXISTS "Admin access to media categories" ON public.media_categories;
DROP POLICY IF EXISTS "Admin access to tags" ON public.tags;
DROP POLICY IF EXISTS "Admin access to content tags" ON public.content_tags;
DROP POLICY IF EXISTS "Admin access to video metadata" ON public.video_metadata;
DROP POLICY IF EXISTS "Admin users can view all error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admin users can view all API usage" ON public.api_usage;
DROP POLICY IF EXISTS "Admin users can view system metrics" ON public.system_metrics;

DROP POLICY IF EXISTS "Users can view own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow initial admin creation" ON public.admin_profiles;

DROP POLICY IF EXISTS "Admin users can manage media assets" ON public.media_assets;

-- Recreate blog_posts policies with optimized auth function calls
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

-- Recreate admin_profiles policies with optimized auth function calls
-- Single policy per action to avoid multiple permissive policies
CREATE POLICY "Users can manage own profile" ON public.admin_profiles
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') = email
    );

-- Recreate content_revisions policies
CREATE POLICY "Admin access to content revisions" ON public.content_revisions
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate generation_sessions policies
CREATE POLICY "Admin access to generation sessions" ON public.generation_sessions
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate categories policies
CREATE POLICY "Admin access to categories" ON public.categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate post_categories policies
CREATE POLICY "Admin access to post categories" ON public.post_categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate media_categories policies
CREATE POLICY "Admin access to media categories" ON public.media_categories
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate tags policies
CREATE POLICY "Admin access to tags" ON public.tags
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate content_tags policies
CREATE POLICY "Admin access to content tags" ON public.content_tags
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate video_metadata policies
CREATE POLICY "Admin access to video metadata" ON public.video_metadata
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate error_logs policies
CREATE POLICY "Admin users can view all error logs" ON public.error_logs
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate api_usage policies
CREATE POLICY "Admin users can view all API usage" ON public.api_usage
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate system_metrics policies
CREATE POLICY "Admin users can view system metrics" ON public.system_metrics
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (SELECT auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Recreate media_assets policies
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
COMMENT ON POLICY "Users can manage own profile" ON public.admin_profiles IS 'Consolidated multiple policies into single policy per action to avoid multiple permissive policies'; 