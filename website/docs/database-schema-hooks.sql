-- Hooks System Database Schema
-- This schema supports the automated workflow system for content management

-- Main hooks table
CREATE TABLE IF NOT EXISTS hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger VARCHAR(100) NOT NULL,
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMP WITH TIME ZONE,
  success_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Constraints
  CONSTRAINT hooks_priority_check CHECK (priority >= 1 AND priority <= 100),
  CONSTRAINT hooks_success_rate_check CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Hook execution logs
CREATE TABLE IF NOT EXISTS hook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hook_id UUID REFERENCES hooks(id) ON DELETE CASCADE,
  trigger VARCHAR(100) NOT NULL,
  event_data JSONB,
  execution_context JSONB,
  result JSONB,
  success BOOLEAN DEFAULT false,
  duration_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_hook_executions_hook_id (hook_id),
  INDEX idx_hook_executions_trigger (trigger),
  INDEX idx_hook_executions_executed_at (executed_at),
  INDEX idx_hook_executions_success (success)
);

-- Content analyses table (for content analysis hooks)
CREATE TABLE IF NOT EXISTS content_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  results JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_content_analyses_post_id (post_id),
  INDEX idx_content_analyses_type (analysis_type)
);

-- Hook templates table (for reusable hook configurations)
CREATE TABLE IF NOT EXISTS hook_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0
);

-- Workflow definitions (for complex multi-step processes)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger VARCHAR(100) NOT NULL,
  steps JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  execution_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  trigger VARCHAR(100) NOT NULL,
  event_data JSONB,
  execution_context JSONB,
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'running',
  result JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Indexes
  INDEX idx_workflow_executions_workflow_id (workflow_id),
  INDEX idx_workflow_executions_status (status),
  INDEX idx_workflow_executions_started_at (started_at)
);

-- Scheduled tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  hook_id UUID REFERENCES hooks(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT scheduled_tasks_target_check CHECK (
    (hook_id IS NOT NULL AND workflow_id IS NULL) OR
    (hook_id IS NULL AND workflow_id IS NOT NULL)
  )
);

-- Event logs table (for debugging and monitoring)
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  source VARCHAR(100),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_event_logs_type (event_type),
  INDEX idx_event_logs_created_at (created_at),
  INDEX idx_event_logs_user_id (user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hooks_trigger ON hooks(trigger);
CREATE INDEX IF NOT EXISTS idx_hooks_enabled ON hooks(enabled);
CREATE INDEX IF NOT EXISTS idx_hooks_priority ON hooks(priority);
CREATE INDEX IF NOT EXISTS idx_hooks_created_by ON hooks(created_by);

-- RLS Policies
ALTER TABLE hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Policies for hooks
CREATE POLICY "Users can view their own hooks" ON hooks
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create hooks" ON hooks
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own hooks" ON hooks
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own hooks" ON hooks
  FOR DELETE USING (created_by = auth.uid());

-- Policies for hook executions (read-only for hook owners)
CREATE POLICY "Users can view executions of their hooks" ON hook_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hooks 
      WHERE hooks.id = hook_executions.hook_id 
      AND hooks.created_by = auth.uid()
    )
  );

-- Policies for content analyses
CREATE POLICY "Users can view analyses of their posts" ON content_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts 
      WHERE blog_posts.id = content_analyses.post_id 
      AND blog_posts.created_by = auth.uid()
    )
  );

CREATE POLICY "System can create content analyses" ON content_analyses
  FOR INSERT WITH CHECK (true); -- Allow system to create analyses

-- Functions for hook management

-- Function to trigger hooks
CREATE OR REPLACE FUNCTION trigger_hooks(
  p_trigger VARCHAR(100),
  p_event_data JSONB,
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  hook_record RECORD;
  execution_count INTEGER := 0;
BEGIN
  -- Log the event
  INSERT INTO event_logs (event_type, event_data, user_id)
  VALUES (p_trigger, p_event_data, p_user_id);
  
  -- Find and execute applicable hooks
  FOR hook_record IN
    SELECT * FROM hooks 
    WHERE trigger = p_trigger 
    AND enabled = true
    ORDER BY priority ASC
  LOOP
    -- TODO: Implement condition evaluation in SQL
    -- For now, we'll let the application handle hook execution
    execution_count := execution_count + 1;
  END LOOP;
  
  RETURN execution_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update hook statistics
CREATE OR REPLACE FUNCTION update_hook_stats(
  p_hook_id UUID,
  p_success BOOLEAN,
  p_duration_ms INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE hooks 
  SET 
    execution_count = execution_count + 1,
    last_executed = CURRENT_TIMESTAMP,
    success_rate = CASE 
      WHEN execution_count = 0 THEN 
        CASE WHEN p_success THEN 100 ELSE 0 END
      ELSE 
        ((success_rate * execution_count) + (CASE WHEN p_success THEN 100 ELSE 0 END)) / (execution_count + 1)
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_hook_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old execution logs
CREATE OR REPLACE FUNCTION cleanup_old_execution_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Keep last 30 days of execution logs
  DELETE FROM hook_executions 
  WHERE executed_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Keep last 7 days of event logs
  DELETE FROM event_logs 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get hook performance metrics
CREATE OR REPLACE FUNCTION get_hook_metrics(
  p_hook_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  hook_id UUID,
  hook_name VARCHAR(255),
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  success_rate NUMERIC,
  avg_duration_ms NUMERIC,
  last_execution TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    COUNT(he.id) as total_executions,
    COUNT(he.id) FILTER (WHERE he.success = true) as successful_executions,
    COUNT(he.id) FILTER (WHERE he.success = false) as failed_executions,
    ROUND(
      (COUNT(he.id) FILTER (WHERE he.success = true)::NUMERIC / NULLIF(COUNT(he.id), 0)) * 100, 
      2
    ) as success_rate,
    ROUND(AVG(he.duration_ms), 2) as avg_duration_ms,
    MAX(he.executed_at) as last_execution
  FROM hooks h
  LEFT JOIN hook_executions he ON h.id = he.hook_id
    AND he.executed_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL
  WHERE (p_hook_id IS NULL OR h.id = p_hook_id)
  GROUP BY h.id, h.name
  ORDER BY h.name;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_hooks_updated_at
  BEFORE UPDATE ON hooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default hooks
INSERT INTO hooks (name, description, trigger, conditions, actions, enabled, priority) VALUES
(
  'Auto-Generate Audio for Published Posts',
  'Automatically generate audio narration when a post is published',
  'post.published',
  '[
    {"field": "content", "operator": "exists", "value": true, "type": "string"},
    {"field": "content.length", "operator": "gt", "value": 100, "type": "number"}
  ]',
  '[
    {
      "type": "generate_audio",
      "parameters": {
        "text": "{{content}}",
        "voice_id": "EXAVITQu4vr4xnSDxMaL",
        "title": "Audio: {{title}}",
        "post_id": "{{id}}"
      },
      "order": 1,
      "retry_count": 2,
      "timeout": 30000
    }
  ]',
  true,
  1
),
(
  'SEO Optimization on Post Update',
  'Optimize SEO fields when a post is updated',
  'post.updated',
  '[
    {"field": "seo_title", "operator": "not_exists", "value": true, "type": "string"},
    {"field": "seo_description", "operator": "not_exists", "value": true, "type": "string"}
  ]',
  '[
    {
      "type": "optimize_seo",
      "parameters": {
        "post_id": "{{id}}"
      },
      "order": 1,
      "retry_count": 1,
      "timeout": 10000
    }
  ]',
  true,
  2
),
(
  'Content Analysis on Post Creation',
  'Analyze content quality when a new post is created',
  'post.created',
  '[
    {"field": "content", "operator": "exists", "value": true, "type": "string"},
    {"field": "status", "operator": "eq", "value": "draft", "type": "string"}
  ]',
  '[
    {
      "type": "analyze_content",
      "parameters": {
        "post_id": "{{id}}",
        "analysis_type": "quality"
      },
      "order": 1,
      "retry_count": 1,
      "timeout": 15000
    }
  ]',
  true,
  3
)
ON CONFLICT (name) DO NOTHING;

-- Insert default hook templates
INSERT INTO hook_templates (name, description, category, template_data, is_public) VALUES
(
  'Auto Audio Generation',
  'Generate audio narration for published posts',
  'content',
  '{
    "trigger": "post.published",
    "conditions": [
      {"field": "content", "operator": "exists", "value": true, "type": "string"}
    ],
    "actions": [
      {
        "type": "generate_audio",
        "parameters": {
          "text": "{{content}}",
          "voice_id": "EXAVITQu4vr4xnSDxMaL",
          "title": "Audio: {{title}}",
          "post_id": "{{id}}"
        },
        "order": 1,
        "retry_count": 2,
        "timeout": 30000
      }
    ]
  }',
  true
),
(
  'Social Media Auto-Post',
  'Automatically post to social media when content is published',
  'social',
  '{
    "trigger": "post.published",
    "conditions": [
      {"field": "featured_image_url", "operator": "exists", "value": true, "type": "string"}
    ],
    "actions": [
      {
        "type": "post_to_social",
        "parameters": {
          "post_id": "{{id}}",
          "platforms": ["twitter", "facebook"],
          "message_template": "🎨 New blog post: {{title}} {{url}} {{hashtags}}"
        },
        "order": 1,
        "retry_count": 3,
        "timeout": 15000
      }
    ]
  }',
  true
),
(
  'Email Notification',
  'Send email notifications for important events',
  'notification',
  '{
    "trigger": "post.published",
    "conditions": [
      {"field": "status", "operator": "eq", "value": "published", "type": "string"}
    ],
    "actions": [
      {
        "type": "send_email",
        "parameters": {
          "to": "admin@artfularchivesstudio.com",
          "subject": "New Post Published: {{title}}",
          "template": "post_published",
          "data": {
            "post_title": "{{title}}",
            "post_url": "{{url}}",
            "post_excerpt": "{{excerpt}}"
          }
        },
        "order": 1,
        "retry_count": 2,
        "timeout": 10000
      }
    ]
  }',
  true
)
ON CONFLICT (name) DO NOTHING;

-- Create a scheduled job to clean up old logs (if pg_cron is available)
-- SELECT cron.schedule('cleanup-hook-logs', '0 2 * * *', 'SELECT cleanup_old_execution_logs();');