-- 🎭 The Multilingual Titles Symphony - Adding Missing Translated Titles Support
-- 
-- "In our grand audio orchestration, we discovered that while we had room for translated content,
-- we had forgotten to make space for translated titles! Like a concert hall that forgot to 
-- install signs in multiple languages at the entrance."

-- Add the missing translated_titles column to audio_jobs
ALTER TABLE public.audio_jobs 
ADD COLUMN IF NOT EXISTS translated_titles JSONB DEFAULT '{}';

-- The translated_titles column will store translated titles for different languages:
-- {
--   "en": "Original English Title",
--   "es": "Título en Español", 
--   "hi": "हिंदी में शीर्षक"
-- }

COMMENT ON COLUMN public.audio_jobs.translated_titles IS 'JSON object containing translated titles for different languages (en, es, hi)';

-- Create an index for efficient querying of translated titles
CREATE INDEX IF NOT EXISTS idx_audio_jobs_translated_titles 
ON public.audio_jobs USING GIN (translated_titles);