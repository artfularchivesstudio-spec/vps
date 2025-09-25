-- Add language-specific draft status tracking
ALTER TABLE audio_jobs
ADD COLUMN IF NOT EXISTS language_statuses JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS completed_languages TEXT[] DEFAULT '{}';

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audio_jobs_language_statuses ON audio_jobs USING gin (language_statuses);

COMMENT ON COLUMN audio_jobs.language_statuses IS 'Stores per-language status information as {language: {status: string, draft: boolean}}';
COMMENT ON COLUMN audio_jobs.is_draft IS 'Whether this job is still in draft mode (true) or final submission (false)';
COMMENT ON COLUMN audio_jobs.completed_languages IS 'Array of languages that have completed processing';

-- Function to update language status
CREATE OR REPLACE FUNCTION update_language_status(
  job_id UUID,
  lang TEXT,
  new_status TEXT,
  is_draft_mode BOOLEAN
) RETURNS void AS $$
BEGIN
  UPDATE audio_jobs
  SET language_statuses = jsonb_set(
    COALESCE(language_statuses, '{}'::jsonb),
    ARRAY[lang],
    jsonb_build_object('status', new_status, 'draft', is_draft_mode)
  )
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql; 