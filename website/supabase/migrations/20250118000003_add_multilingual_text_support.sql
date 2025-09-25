-- Add support for multilingual text content in audio_jobs
ALTER TABLE public.audio_jobs 
ADD COLUMN IF NOT EXISTS translated_texts JSONB DEFAULT '{}';

-- The translated_texts column will store translated content for different languages:
-- {
--   "en": "Original English text...",
--   "es": "Texto traducido al español...", 
--   "hi": "हिंदी में अनुवादित पाठ..."
-- }

COMMENT ON COLUMN public.audio_jobs.translated_texts IS 'JSON object containing translated text for different languages (en, es, hi)';

-- Also add multilingual support to blog_posts for storing translations
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS content_translations JSONB DEFAULT '{}';

ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS title_translations JSONB DEFAULT '{}';

ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS excerpt_translations JSONB DEFAULT '{}';

COMMENT ON COLUMN public.blog_posts.content_translations IS 'JSON object containing translated content for different languages';
COMMENT ON COLUMN public.blog_posts.title_translations IS 'JSON object containing translated titles for different languages';
COMMENT ON COLUMN public.blog_posts.excerpt_translations IS 'JSON object containing translated excerpts for different languages'; 