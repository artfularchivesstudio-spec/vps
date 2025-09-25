-- Add support for multilingual audio files
ALTER TABLE public.audio_jobs 
ADD COLUMN IF NOT EXISTS audio_urls JSONB DEFAULT '{}';

-- The audio_urls column will store URLs for different languages:
-- {
--   "en": "https://..../audio_en.mp3",
--   "es": "https://..../audio_es.mp3", 
--   "hi": "https://..../audio_hi.mp3"
-- }

COMMENT ON COLUMN public.audio_jobs.audio_urls IS 'JSON object containing audio URLs for different languages (en, es, hi)';

-- Keep the original audio_url column for backward compatibility
-- It will contain the English version by default 