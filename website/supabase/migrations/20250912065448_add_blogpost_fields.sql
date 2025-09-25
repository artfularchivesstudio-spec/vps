-- supabase/migrations/20250912000001_add_blogpost_fields.sql
-- Add new columns to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS template_type TEXT,
ADD COLUMN IF NOT EXISTS seo_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reading_time INTEGER,
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS title_translations JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_translations JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS excerpt_translations JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_assets_by_language JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_template_type ON blog_posts(template_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_reading_time ON blog_posts(reading_time);
CREATE INDEX IF NOT EXISTS idx_blog_posts_revision_number ON blog_posts(revision_number);

-- Add GIN indexes for JSONB columns for better search performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_seo_metadata_gin ON blog_posts USING GIN (seo_metadata);
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_translations_gin ON blog_posts USING GIN (title_translations);
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_translations_gin ON blog_posts USING GIN (content_translations);
CREATE INDEX IF NOT EXISTS idx_blog_posts_excerpt_translations_gin ON blog_posts USING GIN (excerpt_translations);
CREATE INDEX IF NOT EXISTS idx_blog_posts_audio_assets_gin ON blog_posts USING GIN (audio_assets_by_language);

-- Add constraints
ALTER TABLE blog_posts
ADD CONSTRAINT chk_reading_time_positive CHECK (reading_time IS NULL OR reading_time > 0),
ADD CONSTRAINT chk_revision_number_positive CHECK (revision_number > 0);

-- Add comments for documentation
COMMENT ON COLUMN blog_posts.template_type IS 'Type of blog post template used';
COMMENT ON COLUMN blog_posts.seo_metadata IS 'JSON object containing SEO metadata (meta_description, og_title, etc.)';
COMMENT ON COLUMN blog_posts.reading_time IS 'Estimated reading time in minutes';
COMMENT ON COLUMN blog_posts.revision_number IS 'Version number for content revisions';
COMMENT ON COLUMN blog_posts.title_translations IS 'JSON object with translations: {"en": "Title", "es": "Título"}';
COMMENT ON COLUMN blog_posts.content_translations IS 'JSON object with content translations by language';
COMMENT ON COLUMN blog_posts.excerpt_translations IS 'JSON object with excerpt translations by language';
COMMENT ON COLUMN blog_posts.audio_assets_by_language IS 'JSON object with audio file URLs by language';

-- Create a function to automatically update revision_number
CREATE OR REPLACE FUNCTION increment_revision_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if content, title, or excerpt changed
  IF OLD.content != NEW.content OR
     OLD.title != NEW.title OR
     OLD.excerpt != NEW.excerpt THEN
    NEW.revision_number = COALESCE(OLD.revision_number, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment revision number
DROP TRIGGER IF EXISTS trigger_increment_revision ON blog_posts;
CREATE TRIGGER trigger_increment_revision
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_revision_number();

-- Create a function to calculate reading time (basic word count / 200 WPM)
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Basic calculation: word count / 200 words per minute
  RETURN GREATEST(1, ROUND(array_length(string_to_array(content_text, ' '), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- Create a function to auto-update reading time
CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time = calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update reading time
DROP TRIGGER IF EXISTS trigger_update_reading_time ON blog_posts;
CREATE TRIGGER trigger_update_reading_time
  BEFORE INSERT OR UPDATE OF content ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_time();