-- Drop dependent policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can manage all API keys" ON public.external_api_keys;
DROP POLICY IF EXISTS "Admins can manage all audio jobs" ON public.audio_jobs;

-- Drop the incorrect is_admin_user functions
DROP FUNCTION IF EXISTS public.is_admin_user();
DROP FUNCTION IF EXISTS public.is_admin_user(user_id uuid);

-- Recreate the is_admin_user function with the correct logic
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM admin_profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'super_admin')
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Recreate policies
CREATE POLICY "Super admins can manage all profiles"
  ON public.admin_profiles FOR ALL
  USING (public.is_admin_user());

CREATE POLICY "Admins can manage all API keys"
  ON public.external_api_keys FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can manage all audio jobs"
  ON public.audio_jobs FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user()); 