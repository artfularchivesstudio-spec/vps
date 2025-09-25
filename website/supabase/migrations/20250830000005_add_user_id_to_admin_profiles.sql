-- Check if the user_id column already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_profiles' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.admin_profiles
        ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE public.admin_profiles
        ADD CONSTRAINT admin_profiles_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add the unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_profiles_user_id_key'
    ) THEN
        ALTER TABLE public.admin_profiles
        ADD CONSTRAINT admin_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Optional: Update existing rows if needed, e.g., by linking to existing auth.users
-- UPDATE public.admin_profiles SET user_id = (SELECT id FROM auth.users WHERE email = public.admin_profiles.email) WHERE user_id IS NULL;

-- Make user_id NOT NULL after backfilling if necessary and if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_profiles' 
        AND column_name = 'user_id'
        AND is_nullable = 'YES'
    ) THEN
        -- Only make NOT NULL if all rows have values
        IF NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id IS NULL) THEN
            ALTER TABLE public.admin_profiles
            ALTER COLUMN user_id SET NOT NULL;
        END IF;
    END IF;
END $$;