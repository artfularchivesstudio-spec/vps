-- Add rich media support to blog posts
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS cover_image JSONB DEFAULT NULL;

-- Cover image structure:
-- {
--   "url": "https://...",
--   "alt": "Description of image",
--   "caption": "Optional caption",
--   "width": 1920,
--   "height": 1080,
--   "photographer": "Optional credit"
-- }

ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS media_gallery JSONB DEFAULT '[]';

-- Media gallery structure (array of media items):
-- [
--   {
--     "type": "image",
--     "url": "https://...",
--     "thumbnail_url": "https://...",
--     "alt": "Description",
--     "caption": "Optional caption",
--     "width": 1920,
--     "height": 1080,
--     "order": 1
--   },
--   {
--     "type": "video",
--     "url": "https://youtube.com/watch?v=...",
--     "thumbnail_url": "https://...",
--     "title": "Video title",
--     "duration": "5:30",
--     "platform": "youtube",
--     "embed_url": "https://youtube.com/embed/...",
--     "order": 2
--   }
-- ]

ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS "references" JSONB DEFAULT '[]';

-- References structure (array of reference items):
-- [
--   {
--     "type": "article",
--     "title": "Related Article Title",
--     "url": "https://...",
--     "author": "Author Name",
--     "publication": "Publication Name",
--     "date": "2024-01-15"
--   },
--   {
--     "type": "artwork",
--     "title": "Artwork Name",
--     "artist": "Artist Name",
--     "year": "2023",
--     "medium": "Oil on canvas",
--     "url": "https://museum.org/artwork/123"
--   }
-- ]

ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]';

-- Content blocks for structured content (array of blocks):
-- [
--   {
--     "type": "text",
--     "content": "Paragraph content...",
--     "order": 1
--   },
--   {
--     "type": "image",
--     "url": "https://...",
--     "alt": "Description",
--     "caption": "Caption",
--     "alignment": "center",
--     "order": 2
--   },
--   {
--     "type": "quote",
--     "content": "Art is not what you see...",
--     "author": "Edgar Degas",
--     "order": 3
--   },
--   {
--     "type": "video",
--     "url": "https://vimeo.com/...",
--     "platform": "vimeo",
--     "order": 4
--   }
-- ]

-- Add comments
COMMENT ON COLUMN public.blog_posts.cover_image IS 'Main hero/cover image for the blog post with metadata';
COMMENT ON COLUMN public.blog_posts.media_gallery IS 'Array of additional media items (images, videos) for the post';
COMMENT ON COLUMN public.blog_posts."references" IS 'Array of external references, citations, and related links';
COMMENT ON COLUMN public.blog_posts.content_blocks IS 'Structured content blocks for rich text with embedded media';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_cover_image ON public.blog_posts USING GIN (cover_image);
CREATE INDEX IF NOT EXISTS idx_blog_posts_media_gallery ON public.blog_posts USING GIN (media_gallery); 