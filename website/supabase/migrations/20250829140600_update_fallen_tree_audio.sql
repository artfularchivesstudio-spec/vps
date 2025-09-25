-- Update the post with the audio URL
UPDATE blog_posts
SET 
  media_gallery = jsonb_build_array(
    jsonb_build_object(
      'type', 'audio',
      'url', 'https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/audio/audio/689aea45-12ab-4a52-841a-e1098c0b2ce3_en_full_audio.mp3?utm_source=chatgpt.com',
      'language', 'en'
    )
  )
WHERE slug = 'the-fallen-tree-bridge-final';

-- Keep only one post with this title and update its image if needed
WITH chosen_post AS (
  SELECT id FROM blog_posts WHERE slug = 'the-fallen-tree-bridge-final'
)
DELETE FROM blog_posts 
WHERE 
  title LIKE 'The Fallen Tree Bridge - Final Recovery' 
  AND id NOT IN (SELECT id FROM chosen_post);

-- Set featured image if not present
UPDATE blog_posts
SET 
  featured_image_url = COALESCE(
    featured_image_url, 
    'https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/images/689aea45-12ab-4a52-841a-e1098c0b2ce3.jpg'
  )
WHERE slug = 'the-fallen-tree-bridge-final';