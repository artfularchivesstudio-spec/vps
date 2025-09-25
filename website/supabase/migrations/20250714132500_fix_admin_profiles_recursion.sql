-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "admin_profiles_optimized" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.admin_profiles;

-- Create a new, non-recursive policy for super admins (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage all profiles' AND tablename = 'admin_profiles') THEN
        CREATE POLICY "Super admins can manage all profiles"
          ON public.admin_profiles FOR ALL
          USING (is_admin_user());
    END IF;
END $$; 