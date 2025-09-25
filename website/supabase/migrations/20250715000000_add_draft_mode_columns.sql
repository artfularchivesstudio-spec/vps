-- Add missing columns to audio_jobs table if they don't exist
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'is_draft') THEN
        ALTER TABLE audio_jobs ADD COLUMN is_draft boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'languages') THEN
        ALTER TABLE audio_jobs ADD COLUMN languages text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'language_statuses') THEN
        ALTER TABLE audio_jobs ADD COLUMN language_statuses jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'completed_languages') THEN
        ALTER TABLE audio_jobs ADD COLUMN completed_languages text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'current_language') THEN
        ALTER TABLE audio_jobs ADD COLUMN current_language text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'total_chunks') THEN
        ALTER TABLE audio_jobs ADD COLUMN total_chunks integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'processed_chunks') THEN
        ALTER TABLE audio_jobs ADD COLUMN processed_chunks integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'chunk_audio_urls') THEN
        ALTER TABLE audio_jobs ADD COLUMN chunk_audio_urls jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audio_jobs' AND indexname = 'idx_audio_jobs_is_draft') THEN
        CREATE INDEX idx_audio_jobs_is_draft ON audio_jobs(is_draft);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audio_jobs' AND indexname = 'idx_audio_jobs_status_created') THEN
        CREATE INDEX idx_audio_jobs_status_created ON audio_jobs(status, created_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audio_jobs' AND indexname = 'idx_audio_jobs_language_statuses') THEN
        CREATE INDEX idx_audio_jobs_language_statuses ON audio_jobs USING gin(language_statuses);
    END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN audio_jobs.is_draft IS 'Whether this job is in draft mode (single language first)';
COMMENT ON COLUMN audio_jobs.languages IS 'Array of language codes to process';
COMMENT ON COLUMN audio_jobs.language_statuses IS 'Status and URLs for each language';
COMMENT ON COLUMN audio_jobs.completed_languages IS 'Array of completed language codes';
COMMENT ON COLUMN audio_jobs.current_language IS 'Currently processing language code';
COMMENT ON COLUMN audio_jobs.total_chunks IS 'Total number of text chunks to process';
COMMENT ON COLUMN audio_jobs.processed_chunks IS 'Number of chunks processed so far';
COMMENT ON COLUMN audio_jobs.chunk_audio_urls IS 'JSON array of URLs for processed audio chunks'; 