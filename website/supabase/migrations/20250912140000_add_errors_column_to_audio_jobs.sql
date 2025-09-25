-- Add missing 'errors' column to audio_jobs table
-- This column stores error information for failed language processing

ALTER TABLE public.audio_jobs
ADD COLUMN IF NOT EXISTS errors JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.audio_jobs.errors IS 'JSON object containing error messages for failed language processing';

-- Add GIN index for better query performance on errors
CREATE INDEX IF NOT EXISTS idx_audio_jobs_errors_gin ON public.audio_jobs USING GIN (errors);