-- Check if the rate_limit column already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'external_api_keys' 
        AND column_name = 'rate_limit'
    ) THEN
        ALTER TABLE public.external_api_keys
        ADD COLUMN rate_limit INTEGER DEFAULT 100 NOT NULL;
    END IF;
END $$;