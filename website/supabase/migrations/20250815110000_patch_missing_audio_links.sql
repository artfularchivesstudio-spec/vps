-- Data Patch: Link existing audio assets to their corresponding blog posts

-- This script finds all media_assets that have a related_post_id but where
-- the blog_post's primary_audio_id is not set. It then updates the blog_post
-- to correctly link to the media asset.

UPDATE public.blog_posts
SET primary_audio_id = media_assets.id
FROM public.media_assets
WHERE
    public.blog_posts.id = public.media_assets.related_post_id
AND
    public.blog_posts.primary_audio_id IS NULL;

-- This ensures that any audio generated prior to the foreign key constraint
-- is correctly linked, without requiring manual re-generation.
