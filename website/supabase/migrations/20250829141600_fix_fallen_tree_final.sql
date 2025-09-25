-- This migration will:
-- 1. Keep only the original "The Fallen Tree Bridge" post
-- 2. Update it with the proper image and audio
-- 3. Delete all other duplicate posts

-- First, update the original post with the best image and audio
UPDATE blog_posts
SET 
  featured_image_url = 'https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/images/689aea45-12ab-4a52-841a-e1098c0b2ce3.jpg',
  media_gallery = jsonb_build_array(
    jsonb_build_object(
      'type', 'audio',
      'url', 'https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/audio/audio/689aea45-12ab-4a52-841a-e1098c0b2ce3_en_full_audio.mp3?utm_source=chatgpt.com',
      'language', 'en'
    )
  ),
  content = CASE WHEN content IS NULL OR content = '' THEN 
    '<p>At the edge of the lake, the tree bowed to the water. It had stood for years, tall and unwavering, until one evening the sky turned lavender and rose, and it leaned into its destiny. Instead of breaking, it offered itself as a bridge.</p>

<p>Some would see only a fallen tree, but others would recognize a threshold — a passage between two worlds. On one side, the green steadiness of land. On the other, the mirrored stillness of the lake, a place of reflection and possibility.</p>

<p>Perhaps it wasn''t an accident. Perhaps the tree chose this moment — when the clouds burned pink with twilight — to lay itself down. To remind those who passed by that sometimes collapse is not failure, but transformation. That even in falling, we can create new ways forward.</p>

<p>Children might scamper across its broad trunk, seeing it as a secret path. Lovers might pause, wondering if they too should cross. And travelers with weary hearts might understand: bridges don''t always arrive built from stone; sometimes they are given to us by nature, gracefully, unexpectedly.</p>

<p>So yes, it is a good omen. A quiet invitation. The tree is not gone — it has simply become something new: a bridge between what was and what could be.</p>'
  ELSE content END,
  title = 'The Fallen Tree Bridge',
  slug = 'the-fallen-tree-bridge',
  status = 'published'
WHERE id = '57765fb1-62ed-47ce-bbd1-001bc78cf750';

-- Delete all other fallen tree posts
DELETE FROM blog_posts 
WHERE 
  title LIKE '%Fallen Tree%' 
  AND id != '57765fb1-62ed-47ce-bbd1-001bc78cf750';