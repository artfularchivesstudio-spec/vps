-- Add the missing translated_titles column to audio_jobs table
ALTER TABLE public.audio_jobs ADD COLUMN IF NOT EXISTS translated_titles JSONB DEFAULT '{}';

-- Add a comment to explain the column
COMMENT ON COLUMN public.audio_jobs.translated_titles IS 'JSON object containing translated titles for different languages (en, es, hi)';

-- Create an index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audio_jobs_translated_titles ON public.audio_jobs USING GIN (translated_titles);