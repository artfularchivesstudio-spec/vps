-- Force RLS Optimization with New Policy Names
-- This migration recreates all policies with new names to ensure the linter picks up the changes

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Admin users can read blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin users can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.admin_profiles;
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
DROP POLICY IF EXISTS "Admin users can manage media assets" ON public.media_assets;

-- Create new optimized policies with different names (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_read_blog_posts' AND tablename = 'blog_posts') THEN
        CREATE POLICY "optimized_admin_read_blog_posts" ON public.blog_posts
            FOR SELECT USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_insert_blog_posts' AND tablename = 'blog_posts') THEN
        CREATE POLICY "optimized_admin_insert_blog_posts" ON public.blog_posts
            FOR INSERT WITH CHECK (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_update_blog_posts' AND tablename = 'blog_posts') THEN
        CREATE POLICY "optimized_admin_update_blog_posts" ON public.blog_posts
            FOR UPDATE USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_delete_blog_posts' AND tablename = 'blog_posts') THEN
        CREATE POLICY "optimized_admin_delete_blog_posts" ON public.blog_posts
            FOR DELETE USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_users_manage_own_profile' AND tablename = 'admin_profiles') THEN
        CREATE POLICY "optimized_users_manage_own_profile" ON public.admin_profiles
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') = email
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_content_revisions' AND tablename = 'content_revisions') THEN
        CREATE POLICY "optimized_admin_content_revisions" ON public.content_revisions
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_generation_sessions' AND tablename = 'generation_sessions') THEN
        CREATE POLICY "optimized_admin_generation_sessions" ON public.generation_sessions
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_categories' AND tablename = 'categories') THEN
        CREATE POLICY "optimized_admin_categories" ON public.categories
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_post_categories' AND tablename = 'post_categories') THEN
        CREATE POLICY "optimized_admin_post_categories" ON public.post_categories
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_media_categories' AND tablename = 'media_categories') THEN
        CREATE POLICY "optimized_admin_media_categories" ON public.media_categories
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_tags' AND tablename = 'tags') THEN
        CREATE POLICY "optimized_admin_tags" ON public.tags
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_content_tags' AND tablename = 'content_tags') THEN
        CREATE POLICY "optimized_admin_content_tags" ON public.content_tags
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_video_metadata' AND tablename = 'video_metadata') THEN
        CREATE POLICY "optimized_admin_video_metadata" ON public.video_metadata
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_error_logs' AND tablename = 'error_logs') THEN
        CREATE POLICY "optimized_admin_error_logs" ON public.error_logs
            FOR SELECT USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_api_usage' AND tablename = 'api_usage') THEN
        CREATE POLICY "optimized_admin_api_usage" ON public.api_usage
            FOR SELECT USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_system_metrics' AND tablename = 'system_metrics') THEN
        CREATE POLICY "optimized_admin_system_metrics" ON public.system_metrics
            FOR SELECT USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'optimized_admin_media_assets' AND tablename = 'media_assets') THEN
        CREATE POLICY "optimized_admin_media_assets" ON public.media_assets
            FOR ALL USING (
                (SELECT auth.role()) = 'authenticated' AND 
                (SELECT auth.jwt() ->> 'email') IN (
                    SELECT email FROM public.admin_profiles WHERE role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

-- Add comprehensive comments for all new policies
COMMENT ON POLICY "optimized_admin_read_blog_posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_insert_blog_posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_update_blog_posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_delete_blog_posts" ON public.blog_posts IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_users_manage_own_profile" ON public.admin_profiles IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_content_revisions" ON public.content_revisions IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_generation_sessions" ON public.generation_sessions IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_categories" ON public.categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_post_categories" ON public.post_categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_media_categories" ON public.media_categories IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_tags" ON public.tags IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_content_tags" ON public.content_tags IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_video_metadata" ON public.video_metadata IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_error_logs" ON public.error_logs IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_api_usage" ON public.api_usage IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_system_metrics" ON public.system_metrics IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row';
COMMENT ON POLICY "optimized_admin_media_assets" ON public.media_assets IS 'Optimized with (SELECT auth.role()) and (SELECT auth.jwt()) to avoid re-evaluation per row'; 