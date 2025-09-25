-- 🎭 The Grand Admin Profile Creation Ceremony
-- Creating admin profile for the authenticated user: 1fe15ae9-9a82-4054-bb15-8b08c001f179

-- ✨ Insert admin profile for the authenticated user
INSERT INTO public.admin_profiles (
  id,
  user_id, 
  email,
  role,
  first_name,
  last_name,
  created_at,
  updated_at
) VALUES (
  '1fe15ae9-9a82-4054-bb15-8b08c001f179',
  '1fe15ae9-9a82-4054-bb15-8b08c001f179',
  'admin@artfularchives.com',
  'super_admin',
  'Spellbinding',
  'Director',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  updated_at = NOW();

-- 🎪 Log the magical transformation
COMMENT ON TABLE public.admin_profiles IS 'The sacred registry of digital curators and mystical administrators';