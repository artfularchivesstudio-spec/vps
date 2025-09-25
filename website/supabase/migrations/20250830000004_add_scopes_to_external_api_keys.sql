-- Check if the scopes column already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'external_api_keys' 
        AND column_name = 'scopes'
    ) THEN
        ALTER TABLE public.external_api_keys
        ADD COLUMN scopes text[] DEFAULT '{}'::text[] NOT NULL;
    END IF;
END $$;

-- Optional: Add a default value for existing rows if needed, or handle in application logic
-- UPDATE public.external_api_keys SET scopes = '{}'::text[] WHERE scopes IS NULL;