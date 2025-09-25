DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous image uploads' AND tablename = 'objects') THEN
        CREATE POLICY "Allow anonymous image uploads"
        ON storage.objects FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'images');
    END IF;
END $$;
