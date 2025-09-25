-- 20250911_fix_audio_jobs_fk_post_id.sql
BEGIN;

-- Ensure column exists (no-op if already present)
ALTER TABLE public.audio_jobs
  ADD COLUMN IF NOT EXISTS post_id uuid;

-- Ensure the FK exists with ON DELETE CASCADE
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(c.oid) INTO def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'audio_jobs'
    AND c.conname = 'fk_post_id'
    AND c.contype = 'f';

  IF def IS NULL THEN
    -- FK missing → create it
    EXECUTE '
      ALTER TABLE public.audio_jobs
      ADD CONSTRAINT fk_post_id
      FOREIGN KEY (post_id)
      REFERENCES public.blog_posts(id)
      ON DELETE CASCADE
    ';
  ELSIF def NOT LIKE 'FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE%' THEN
    -- FK exists but not what we want → replace it
    EXECUTE 'ALTER TABLE public.audio_jobs DROP CONSTRAINT IF EXISTS fk_post_id';
    EXECUTE '
      ALTER TABLE public.audio_jobs
      ADD CONSTRAINT fk_post_id
      FOREIGN KEY (post_id)
      REFERENCES public.blog_posts(id)
      ON DELETE CASCADE
    ';
  END IF;
END$$;

COMMIT;