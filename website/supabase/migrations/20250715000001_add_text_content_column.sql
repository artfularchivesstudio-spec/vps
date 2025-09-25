-- Add text_content column to audio_jobs table for backward compatibility
ALTER TABLE public.audio_jobs 
ADD COLUMN IF NOT EXISTS text_content TEXT;

-- Copy existing data from input_text to text_content
UPDATE public.audio_jobs 
SET text_content = input_text 
WHERE text_content IS NULL AND input_text IS NOT NULL;

-- Add config and post_id columns that the code expects
ALTER TABLE public.audio_jobs 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

ALTER TABLE public.audio_jobs 
ADD COLUMN IF NOT EXISTS post_id UUID;

-- Add comments for new columns
COMMENT ON COLUMN public.audio_jobs.text_content IS 'Alternative column name for input_text, used for backward compatibility';
COMMENT ON COLUMN public.audio_jobs.config IS 'Configuration options for audio generation (voice_id, title, etc)';
COMMENT ON COLUMN public.audio_jobs.post_id IS 'Optional reference to associated blog post'; 