CREATE TABLE IF NOT EXISTS public.audio_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    input_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    audio_url TEXT,
    total_chunks INT,
    processed_chunks INT,
    chunk_audio_urls JSONB
);

COMMENT ON TABLE public.audio_jobs IS 'Table to manage long-running audio generation jobs.';
COMMENT ON COLUMN public.audio_jobs.status IS 'The current status of the job (e.g., pending, processing, complete, failed).';
COMMENT ON COLUMN public.audio_jobs.input_text IS 'The source text to be converted to audio.';
COMMENT ON COLUMN public.audio_jobs.audio_url IS 'The final public URL of the generated audio file.';
COMMENT ON COLUMN public.audio_jobs.total_chunks IS 'The total number of text chunks the job is split into.';
COMMENT ON COLUMN public.audio_jobs.processed_chunks IS 'The number of chunks that have been successfully processed.';
COMMENT ON COLUMN public.audio_jobs.chunk_audio_urls IS 'An array of URLs for the audio of each processed chunk.';

-- Add a trigger to automatically update the updated_at timestamp (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then recreate it
DROP TRIGGER IF EXISTS handle_audio_jobs_updated_at ON public.audio_jobs;

CREATE TRIGGER handle_audio_jobs_updated_at
BEFORE UPDATE ON public.audio_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at(); 