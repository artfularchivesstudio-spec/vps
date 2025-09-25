-- Create a new schema for the extension if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the extension from the public schema
DROP EXTENSION IF EXISTS pg_net;

-- Re-create the extension in the new schema
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Set the search_path for all identified functions to prevent security issues
ALTER FUNCTION public.is_admin_user() SET search_path = public, extensions;
ALTER FUNCTION public.is_admin_user(user_id uuid) SET search_path = public, extensions;
ALTER FUNCTION public.log_api_usage(p_provider text, p_operation text, p_model text, p_tokens_used integer, p_cost_estimate numeric, p_duration_ms integer, p_user_id uuid, p_session_id text, p_success boolean, p_error_message text, p_request_size_bytes integer, p_response_size_bytes integer) SET search_path = public, extensions;
ALTER FUNCTION public.log_error(p_error_type text, p_error_message text, p_error_stack text, p_user_id uuid, p_session_id text, p_request_data jsonb, p_response_data jsonb, p_severity text, p_source text) SET search_path = public, extensions;
ALTER FUNCTION public.setup_audio_worker_cron(api_key text) SET search_path = public, extensions; 