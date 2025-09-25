-- Fix ambiguous column reference in get_or_create_admin_profile function
-- The function was failing due to ambiguous column names after adding user_id column

CREATE OR REPLACE FUNCTION get_or_create_admin_profile()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  profile_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return NULL
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if profile exists (using the id column which is the primary key)
  SELECT ap.id INTO profile_id 
  FROM admin_profiles ap 
  WHERE ap.id = current_user_id;
  
  -- If profile doesn't exist, create it
  IF profile_id IS NULL THEN
    INSERT INTO admin_profiles (id, email, role, first_name, last_name, user_id)
    SELECT 
      au.id,
      au.email,
      'admin'::user_role,
      COALESCE(au.raw_user_meta_data->>'first_name', 'Admin'),
      COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
      au.id  -- Set user_id to the same as id for consistency
    FROM auth.users au
    WHERE au.id = current_user_id;
    
    profile_id := current_user_id;
  END IF;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;