-- Migration: Remove duplicate "The Fallen Tree Bridge" posts, keeping the most complete record
BEGIN;

WITH ranked_posts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY char_length(content) DESC,
               created_at DESC
    ) AS rn
  FROM blog_posts
  WHERE slug = 'the-fallen-tree-bridge'
)

-- Delete all duplicates beyond the top-ranked record
DELETE FROM blog_posts
WHERE id IN (
  SELECT id
  FROM ranked_posts
  WHERE rn > 1
);

COMMIT;