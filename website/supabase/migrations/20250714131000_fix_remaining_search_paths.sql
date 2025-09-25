-- Set the search_path for the remaining identified functions to prevent security issues
ALTER FUNCTION public.ensure_admin_profile() SET search_path = public, extensions;
ALTER FUNCTION public.get_or_create_admin_profile() SET search_path = public, extensions;
ALTER FUNCTION public.set_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions; 