-- Create a new schema for the extension if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the extension from the public schema
DROP EXTENSION IF EXISTS pg_net;

-- Re-create the extension in the new schema
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Set the search_path for all identified functions to prevent security issues
ALTER FUNCTION public.ensure_admin_profile() SET search_path = public, extensions;
ALTER FUNCTION public.get_or_create_admin_profile() SET search_path = public, extensions;
ALTER FUNCTION public.set_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions; 