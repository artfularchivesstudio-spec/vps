-- Create admin_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles (role);

-- Enable Row Level Security
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies


-- Admin policy for full access

-- Grant permissions
GRANT ALL ON public.admin_profiles TO authenticated;

-- Add updated_at trigger

-- Insert a default admin user if none exists (for development/testing)
-- This should be customized for your specific admin user ID

-- Add comments
COMMENT ON TABLE public.admin_profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN public.admin_profiles.role IS 'User role: admin or user';