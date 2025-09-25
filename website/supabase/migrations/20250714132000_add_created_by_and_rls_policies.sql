-- Add created_by column to audio_jobs table (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'created_by') THEN
        ALTER TABLE public.audio_jobs
          ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Set the default value for new rows (idempotent)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_jobs' AND column_name = 'created_by') THEN
        ALTER TABLE public.audio_jobs
          ALTER COLUMN created_by SET DEFAULT auth.uid();
    END IF;
END $$;

-- Note: Existing rows in audio_jobs will have a NULL created_by.
-- These will only be accessible to admins after these policies are applied.

-- RLS Policies for external_api_keys table (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view and manage their own API keys' AND tablename = 'external_api_keys') THEN
        CREATE POLICY "Users can view and manage their own API keys"
          ON public.external_api_keys FOR ALL
          USING (auth.uid() = created_by)
          WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all API keys' AND tablename = 'external_api_keys') THEN
        CREATE POLICY "Admins can manage all API keys"
          ON public.external_api_keys FOR ALL
          USING (public.is_admin_user())
          WITH CHECK (public.is_admin_user());
    END IF;
END $$;

-- RLS Policies for audio_jobs table (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view and manage their own audio jobs' AND tablename = 'audio_jobs') THEN
        CREATE POLICY "Users can view and manage their own audio jobs"
          ON public.audio_jobs FOR ALL
          USING (auth.uid() = created_by)
          WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all audio jobs' AND tablename = 'audio_jobs') THEN
        CREATE POLICY "Admins can manage all audio jobs"
          ON public.audio_jobs FOR ALL
          USING (public.is_admin_user())
          WITH CHECK (public.is_admin_user());
    END IF;
END $$; 