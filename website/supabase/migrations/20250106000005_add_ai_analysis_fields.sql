-- Add AI analysis fields to blog_posts table

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS ai_analysis_openai TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS ai_analysis_claude TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS selected_ai_provider TEXT;