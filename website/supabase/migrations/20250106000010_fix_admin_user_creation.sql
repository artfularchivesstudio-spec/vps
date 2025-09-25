-- Fix admin user creation issue
-- This ensures the current authenticated user gets added to admin_profiles

-- First, let's make sure the trigger function exists and works properly
CREATE OR REPLACE FUNCTION ensure_admin_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into admin_profiles if not exists
  INSERT INTO admin_profiles (id, email, role, first_name, last_name)
  SELECT 
    NEW.id,
    NEW.email,
    'admin'::user_role,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
  WHERE NOT EXISTS (
    SELECT 1 FROM admin_profiles WHERE id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ensure_admin_profile();

-- Also add any existing authenticated users to admin_profiles
INSERT INTO admin_profiles (id, email, role, first_name, last_name)
SELECT 
  id,
  email,
  'admin'::user_role,
  COALESCE(raw_user_meta_data->>'first_name', 'Admin'),
  COALESCE(raw_user_meta_data->>'last_name', 'User')
FROM auth.users
WHERE id NOT IN (SELECT id FROM admin_profiles)
ON CONFLICT (id) DO NOTHING;

-- Create a function to get or create admin profile for current user
CREATE OR REPLACE FUNCTION get_or_create_admin_profile()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
  profile_id UUID;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- If no user is authenticated, return NULL
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if profile exists
  SELECT id INTO profile_id FROM admin_profiles WHERE id = user_id;
  
  -- If profile doesn't exist, create it
  IF profile_id IS NULL THEN
    INSERT INTO admin_profiles (id, email, role, first_name, last_name)
    SELECT 
      id,
      email,
      'admin'::user_role,
      COALESCE(raw_user_meta_data->>'first_name', 'Admin'),
      COALESCE(raw_user_meta_data->>'last_name', 'User')
    FROM auth.users
    WHERE id = user_id;
    
    profile_id := user_id;
  END IF;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 