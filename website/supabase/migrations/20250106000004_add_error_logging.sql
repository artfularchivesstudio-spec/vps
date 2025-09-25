-- Add error logging and observability tables (idempotent)

-- Error logs for tracking system issues
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type TEXT NOT NULL, -- 'upload_error', 'ai_error', 'api_error', etc.
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  request_data JSONB, -- Store request details for debugging
  response_data JSONB, -- Store response details if available
  severity TEXT DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  source TEXT NOT NULL, -- 'frontend', 'api', 'storage', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage tracking for cost monitoring
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL, -- 'openai', 'claude', 'elevenlabs'
  model TEXT, -- 'gpt-4-vision-preview', 'claude-3-5-sonnet', etc.
  operation TEXT NOT NULL, -- 'image-analysis', 'tts-generation', etc.
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,4),
  duration_ms INTEGER,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System health metrics
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL, -- 'upload_success_rate', 'ai_response_time', etc.
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit TEXT, -- 'ms', 'bytes', 'percent', etc.
  time_window TEXT, -- 'last_hour', 'last_day', etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_error_logs_type_created ON error_logs(error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_created ON error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_provider_created ON api_usage(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON api_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_success ON api_usage(success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type_created ON system_metrics(metric_type, created_at DESC);

-- Enable RLS (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'error_logs' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'api_usage' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'system_metrics' AND n.nspname = 'public' AND c.relrowsecurity = false) THEN
        ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS policies for observability tables (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'error_logs' AND policyname = 'Admin users can view all error logs') THEN
        CREATE POLICY "Admin users can view all error logs" ON error_logs FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_usage' AND policyname = 'Admin users can view all API usage') THEN
        CREATE POLICY "Admin users can view all API usage" ON api_usage FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_metrics' AND policyname = 'Admin users can view system metrics') THEN
        CREATE POLICY "Admin users can view system metrics" ON system_metrics FOR ALL USING (
          EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Function to log errors easily
CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_request_data JSONB DEFAULT NULL,
  p_response_data JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'error',
  p_source TEXT DEFAULT 'unknown'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO error_logs (
    error_type, error_message, error_stack, user_id, session_id,
    request_data, response_data, severity, source
  ) VALUES (
    p_error_type, p_error_message, p_error_stack, p_user_id, p_session_id,
    p_request_data, p_response_data, p_severity, p_source
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
  p_provider TEXT,
  p_operation TEXT,
  p_model TEXT DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_cost_estimate DECIMAL(10,4) DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_request_size_bytes INTEGER DEFAULT NULL,
  p_response_size_bytes INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  INSERT INTO api_usage (
    provider, model, operation, tokens_used, cost_estimate, duration_ms,
    user_id, session_id, success, error_message, request_size_bytes, response_size_bytes
  ) VALUES (
    p_provider, p_model, p_operation, p_tokens_used, p_cost_estimate, p_duration_ms,
    p_user_id, p_session_id, p_success, p_error_message, p_request_size_bytes, p_response_size_bytes
  ) RETURNING id INTO usage_id;
  
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;