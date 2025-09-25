-- Create storage buckets for the AI blog creation feature

-- Images bucket for uploaded artwork images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Audio bucket for generated TTS files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/aac']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Video bucket for future video content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video',
  'video',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/mov', 'video/avi']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Documents bucket for any document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- private by default
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for storage buckets (idempotent)

-- Images bucket policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can upload images') THEN
        CREATE POLICY "Admin users can upload images" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'images' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Images are publicly viewable') THEN
        CREATE POLICY "Images are publicly viewable" ON storage.objects
        FOR SELECT USING (bucket_id = 'images');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can update images') THEN
        CREATE POLICY "Admin users can update images" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'images' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can delete images') THEN
        CREATE POLICY "Admin users can delete images" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'images' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Audio bucket policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can upload audio') THEN
        CREATE POLICY "Admin users can upload audio" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'audio' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Audio files are publicly viewable') THEN
        CREATE POLICY "Audio files are publicly viewable" ON storage.objects
        FOR SELECT USING (bucket_id = 'audio');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can update audio') THEN
        CREATE POLICY "Admin users can update audio" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'audio' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can delete audio') THEN
        CREATE POLICY "Admin users can delete audio" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'audio' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Video bucket policies (same pattern)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can upload video') THEN
        CREATE POLICY "Admin users can upload video" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'video' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Video files are publicly viewable') THEN
        CREATE POLICY "Video files are publicly viewable" ON storage.objects
        FOR SELECT USING (bucket_id = 'video');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can update video') THEN
        CREATE POLICY "Admin users can update video" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'video' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can delete video') THEN
        CREATE POLICY "Admin users can delete video" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'video' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Documents bucket policies (private)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can upload documents') THEN
        CREATE POLICY "Admin users can upload documents" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can view documents') THEN
        CREATE POLICY "Admin users can view documents" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can update documents') THEN
        CREATE POLICY "Admin users can update documents" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin users can delete documents') THEN
        CREATE POLICY "Admin users can delete documents" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated' AND
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;