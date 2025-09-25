-- Comprehensive RLS Fix - Address All Linter Warnings
-- This migration targets the specific policies mentioned in the linter warnings

-- Drop ALL existing policies that are causing warnings
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admin users can manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can read blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "optimized_admin_read_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "optimized_admin_insert_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "optimized_admin_update_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "optimized_admin_delete_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "optimized_users_manage_own_profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admin access to content revisions" ON public.content_revisions;
DROP POLICY IF EXISTS "Admin access to generation sessions" ON public.generation_sessions;
DROP POLICY IF EXISTS "Admin access to categories" ON public.categories;
DROP POLICY IF EXISTS "Admin access to post categories" ON public.post_categories;
DROP POLICY IF EXISTS "Admin access to media categories" ON public.media_categories;
DROP POLICY IF EXISTS "Admin access to tags" ON public.tags;
DROP POLICY IF EXISTS "Admin access to content tags" ON public.content_tags;
DROP POLICY IF EXISTS "Admin access to video metadata" ON public.video_metadata;
DROP POLICY IF EXISTS "Admin users can manage media assets" ON public.media_assets;
DROP POLICY IF EXISTS "Admin users can view all error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admin users can view all API usage" ON public.api_usage;
DROP POLICY IF EXISTS "Admin users can view system metrics" ON public.system_metrics;

-- Create optimized policies for admin_profiles (consolidated to avoid multiple permissive policies) (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_profiles_optimized' AND tablename = 'admin_profiles') THEN
        CREATE POLICY "admin_profiles_optimized" ON public.admin_profiles
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (
                    (SELECT auth.jwt() ->> 'email') = email
                    OR 
                    (SELECT auth.jwt() ->> 'email') IN (
                        SELECT email FROM public.admin_profiles WHERE role = 'super_admin'
                    )
                )
            );
    END IF;
END $$;

-- Create optimized policies for blog_posts (consolidated) (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'blog_posts_optimized' AND tablename = 'blog_posts') THEN
        CREATE POLICY "blog_posts_optimized" ON public.blog_posts
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

-- Create optimized policies for all other tables (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'content_revisions_optimized' AND tablename = 'content_revisions') THEN
        CREATE POLICY "content_revisions_optimized" ON public.content_revisions
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'generation_sessions_optimized' AND tablename = 'generation_sessions') THEN
        CREATE POLICY "generation_sessions_optimized" ON public.generation_sessions
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'categories_optimized' AND tablename = 'categories') THEN
        CREATE POLICY "categories_optimized" ON public.categories
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'post_categories_optimized' AND tablename = 'post_categories') THEN
        CREATE POLICY "post_categories_optimized" ON public.post_categories
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'media_categories_optimized' AND tablename = 'media_categories') THEN
        CREATE POLICY "media_categories_optimized" ON public.media_categories
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tags_optimized' AND tablename = 'tags') THEN
        CREATE POLICY "tags_optimized" ON public.tags
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'content_tags_optimized' AND tablename = 'content_tags') THEN
        CREATE POLICY "content_tags_optimized" ON public.content_tags
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'video_metadata_optimized' AND tablename = 'video_metadata') THEN
        CREATE POLICY "video_metadata_optimized" ON public.video_metadata
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'media_assets_optimized' AND tablename = 'media_assets') THEN
        CREATE POLICY "media_assets_optimized" ON public.media_assets
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'error_logs_optimized' AND tablename = 'error_logs') THEN
        CREATE POLICY "error_logs_optimized" ON public.error_logs
            FOR SELECT USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'api_usage_optimized' AND tablename = 'api_usage') THEN
        CREATE POLICY "api_usage_optimized" ON public.api_usage
            FOR SELECT USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'system_metrics_optimized' AND tablename = 'system_metrics') THEN
        CREATE POLICY "system_metrics_optimized" ON public.system_metrics
            FOR SELECT USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

-- Add comprehensive comments for all optimized policies
COMMENT ON POLICY "admin_profiles_optimized" ON public.admin_profiles IS 'Optimized consolidated policy - users can manage own profile, super admins can view all';
COMMENT ON POLICY "blog_posts_optimized" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "content_revisions_optimized" ON public.content_revisions IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "generation_sessions_optimized" ON public.generation_sessions IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "categories_optimized" ON public.categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "post_categories_optimized" ON public.post_categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "media_categories_optimized" ON public.media_categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "tags_optimized" ON public.tags IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "content_tags_optimized" ON public.content_tags IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "video_metadata_optimized" ON public.video_metadata IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "media_assets_optimized" ON public.media_assets IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "error_logs_optimized" ON public.error_logs IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "api_usage_optimized" ON public.api_usage IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "system_metrics_optimized" ON public.system_metrics IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row'; 