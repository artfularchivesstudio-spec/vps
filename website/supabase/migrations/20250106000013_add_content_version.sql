-- Add content_version to blog_posts and audio_jobs to track staleness
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;

ALTER TABLE audio_jobs ADD COLUMN IF NOT EXISTS content_version INTEGER;
ALTER TABLE audio_jobs ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN blog_posts.content_version IS 'Incremented whenever post content changes';
COMMENT ON COLUMN audio_jobs.content_version IS 'Version of content used to generate this audio';
COMMENT ON COLUMN audio_jobs.is_stale IS 'Whether this audio job is out of date due to content changes';
