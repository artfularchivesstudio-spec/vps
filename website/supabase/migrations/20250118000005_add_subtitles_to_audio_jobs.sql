-- Add subtitle fields to audio_jobs table
ALTER TABLE audio_jobs
ADD COLUMN subtitle_urls jsonb DEFAULT '{}'::jsonb,
ADD COLUMN vtt_urls jsonb DEFAULT '{}'::jsonb,
ADD COLUMN srt_urls jsonb DEFAULT '{}'::jsonb;

-- Add indexes for better query performance
CREATE INDEX idx_audio_jobs_subtitle_urls ON audio_jobs USING gin (subtitle_urls);
CREATE INDEX idx_audio_jobs_vtt_urls ON audio_jobs USING gin (vtt_urls);
CREATE INDEX idx_audio_jobs_srt_urls ON audio_jobs USING gin (srt_urls);

-- Add comment for documentation
COMMENT ON COLUMN audio_jobs.subtitle_urls IS 'URLs to generated subtitles in various formats, keyed by language code';
COMMENT ON COLUMN audio_jobs.vtt_urls IS 'URLs to WebVTT format subtitles, keyed by language code';
COMMENT ON COLUMN audio_jobs.srt_urls IS 'URLs to SRT format subtitles, keyed by language code'; 