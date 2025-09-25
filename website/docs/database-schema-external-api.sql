-- External API Keys table
CREATE TABLE IF NOT EXISTS external_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  rate_limit INTEGER NOT NULL DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Request Logs table for rate limiting and auditing
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES external_api_keys(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_api_keys_hash ON external_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_external_api_keys_active ON external_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_key_created ON api_request_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);

-- RLS Policies
ALTER TABLE external_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

-- Policy for external_api_keys - only creators can view/manage their keys
CREATE POLICY "Users can view their own API keys" ON external_api_keys
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create API keys" ON external_api_keys
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own API keys" ON external_api_keys
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own API keys" ON external_api_keys
  FOR DELETE USING (auth.uid() = created_by);

-- Policy for api_request_logs - only view logs for owned API keys
CREATE POLICY "Users can view logs for their API keys" ON api_request_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM external_api_keys 
      WHERE external_api_keys.id = api_request_logs.api_key_id 
      AND external_api_keys.created_by = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_external_api_keys_updated_at
  BEFORE UPDATE ON external_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old API request logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_request_logs 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE 'plpgsql';

-- Create a scheduled job to clean up old logs (if pg_cron is available)
-- SELECT cron.schedule('cleanup-api-logs', '0 2 * * *', 'SELECT cleanup_old_api_logs();');

-- Function to get API key usage statistics
CREATE OR REPLACE FUNCTION get_api_key_stats(key_id UUID)
RETURNS TABLE (
  total_requests BIGINT,
  requests_today BIGINT,
  requests_this_week BIGINT,
  requests_this_month BIGINT,
  avg_response_time NUMERIC,
  error_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as requests_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as requests_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as requests_this_month,
    AVG(response_time_ms) as avg_response_time,
    (COUNT(*) FILTER (WHERE status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0) * 100) as error_rate
  FROM api_request_logs
  WHERE api_key_id = key_id;
END;
$$ LANGUAGE 'plpgsql';

-- Available API scopes
CREATE TYPE api_scope AS ENUM (
  'posts:read',
  'posts:write',
  'posts:delete',
  'posts:publish',
  'media:read',
  'media:write',
  'media:delete',
  'ai:analyze',
  'ai:generate-audio',
  'ai:generate-content',
  'analytics:read',
  'admin:full'
);

-- Insert default API scopes for reference
INSERT INTO public.api_scopes (scope, description) VALUES 
  ('posts:read', 'Read blog posts and metadata'),
  ('posts:write', 'Create and update blog posts'),
  ('posts:delete', 'Delete blog posts'),
  ('posts:publish', 'Publish and unpublish posts'),
  ('media:read', 'Read media assets'),
  ('media:write', 'Upload and manage media assets'),
  ('media:delete', 'Delete media assets'),
  ('ai:analyze', 'Use AI analysis endpoints'),
  ('ai:generate-audio', 'Generate audio using TTS'),
  ('ai:generate-content', 'Generate content using AI'),
  ('analytics:read', 'Read analytics data'),
  ('admin:full', 'Full administrative access')
ON CONFLICT (scope) DO NOTHING;

-- Table to store API scope definitions
CREATE TABLE IF NOT EXISTS api_scopes (
  scope VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add scope validation function
CREATE OR REPLACE FUNCTION validate_api_scopes(scopes TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  scope TEXT;
BEGIN
  FOREACH scope IN ARRAY scopes
  LOOP
    IF NOT EXISTS (SELECT 1 FROM api_scopes WHERE api_scopes.scope = scope OR scope = '*') THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE 'plpgsql';

-- Add constraint to validate scopes
ALTER TABLE external_api_keys 
ADD CONSTRAINT valid_scopes 
CHECK (validate_api_scopes(scopes));

-- Create webhook events table for future use
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES external_api_keys(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  delivered BOOLEAN DEFAULT FALSE,
  delivery_attempts INTEGER DEFAULT 0,
  last_delivery_attempt TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_delivery ON webhook_events(delivered, delivery_attempts);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);