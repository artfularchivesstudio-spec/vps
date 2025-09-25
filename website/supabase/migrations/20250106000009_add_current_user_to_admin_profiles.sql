-- Add current user to admin_profiles table
-- This will handle the foreign key constraint issue

-- Create a function to add any authenticated user to admin_profiles if they don't exist
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

-- Create trigger to automatically add users to admin_profiles
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