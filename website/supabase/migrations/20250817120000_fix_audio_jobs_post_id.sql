-- Fix missing post_id values in audio_jobs table
-- This migration attempts to link existing audio jobs to blog posts based on available patterns

-- Strategy 1: Link based on text content matching
-- If the audio job text_content or input_text matches a blog post's content
UPDATE public.audio_jobs 
SET post_id = blog_posts.id
FROM public.blog_posts
WHERE 
    public.audio_jobs.post_id IS NULL
    AND (
        -- Match based on text content
        (public.audio_jobs.text_content IS NOT NULL AND public.blog_posts.content LIKE '%' || SUBSTRING(public.audio_jobs.text_content, 1, 100) || '%')
        OR 
        -- Match based on input_text
        (public.audio_jobs.input_text IS NOT NULL AND public.blog_posts.content LIKE '%' || SUBSTRING(public.audio_jobs.input_text, 1, 100) || '%')
    )
    -- Only match if title is also similar (to avoid false positives)
    AND (
        public.audio_jobs.config ->> 'title' IS NULL 
        OR public.blog_posts.title ILIKE '%' || (public.audio_jobs.config ->> 'title') || '%'
        OR (public.audio_jobs.config ->> 'title') ILIKE '%' || public.blog_posts.title || '%'
    );

-- Strategy 2: Link based on timing patterns 
-- If an audio job was created close in time to a blog post, they might be related
UPDATE public.audio_jobs 
SET post_id = closest_posts.post_id
FROM (
    SELECT DISTINCT ON (aj.id) 
        aj.id as audio_job_id,
        bp.id as post_id,
        ABS(EXTRACT(EPOCH FROM (aj.created_at - bp.created_at))) as time_diff_seconds
    FROM public.audio_jobs aj
    CROSS JOIN public.blog_posts bp
    WHERE 
        aj.post_id IS NULL
        AND ABS(EXTRACT(EPOCH FROM (aj.created_at - bp.created_at))) < 3600 -- Within 1 hour
    ORDER BY aj.id, time_diff_seconds ASC
) as closest_posts
WHERE public.audio_jobs.id = closest_posts.audio_job_id
AND public.audio_jobs.post_id IS NULL;

-- Add a comment to track this fix
COMMENT ON COLUMN public.audio_jobs.post_id IS 'Foreign key to blog_posts.id - populated by migration 20250817120000_fix_audio_jobs_post_id.sql';