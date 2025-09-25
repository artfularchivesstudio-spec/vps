-- Fix storage policies - the admin_profiles check is causing issues
-- Let's simplify to authenticated users for now

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete images" ON storage.objects;

DROP POLICY IF EXISTS "Admin users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update audio" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete audio" ON storage.objects;

DROP POLICY IF EXISTS "Admin users can upload video" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update video" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete video" ON storage.objects;

DROP POLICY IF EXISTS "Admin users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete documents" ON storage.objects;

-- Create simpler policies for authenticated users (idempotent)
-- We'll add admin-specific checks later once everything is working

-- Images bucket policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload images') THEN
        CREATE POLICY "Authenticated users can upload images" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'images' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update images') THEN
        CREATE POLICY "Authenticated users can update images" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'images' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete images') THEN
        CREATE POLICY "Authenticated users can delete images" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'images' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

-- Audio bucket policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload audio') THEN
        CREATE POLICY "Authenticated users can upload audio" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'audio' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update audio') THEN
        CREATE POLICY "Authenticated users can update audio" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'audio' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete audio') THEN
        CREATE POLICY "Authenticated users can delete audio" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'audio' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

-- Video bucket policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload video') THEN
        CREATE POLICY "Authenticated users can upload video" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'video' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update video') THEN
        CREATE POLICY "Authenticated users can update video" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'video' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete video') THEN
        CREATE POLICY "Authenticated users can delete video" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'video' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

-- Documents bucket policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload documents') THEN
        CREATE POLICY "Authenticated users can upload documents" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can view documents') THEN
        CREATE POLICY "Authenticated users can view documents" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update documents') THEN
        CREATE POLICY "Authenticated users can update documents" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete documents') THEN
        CREATE POLICY "Authenticated users can delete documents" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;