-- 20250911_fix_playground_test_results.sql
BEGIN;

-- Create playground_test_results table for storing test execution history
CREATE TABLE IF NOT EXISTS public.playground_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('mcp', 'chatgpt')),
    tool_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    response_time INTEGER NOT NULL, -- in milliseconds
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_playground_test_results_created_at
  ON public.playground_test_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_type
  ON public.playground_test_results (type);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_status
  ON public.playground_test_results (status);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_tool_name
  ON public.playground_test_results (tool_name);
CREATE INDEX IF NOT EXISTS idx_playground_test_results_type_status
  ON public.playground_test_results (type, status);

-- Enable Row Level Security
ALTER TABLE public.playground_test_results ENABLE ROW LEVEL SECURITY;

-- (Optional) Create RLS policies here if needed

-- Grant permissions
GRANT ALL ON public.playground_test_results TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add/ensure updated_at trigger function (schema-qualified)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Guarded trigger creation (no CREATE TRIGGER IF NOT EXISTS in PG)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger trg
    JOIN pg_class   tbl ON tbl.oid = trg.tgrelid
    JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
    WHERE trg.tgname = 'update_playground_test_results_updated_at'
      AND ns.nspname = 'public'
      AND tbl.relname = 'playground_test_results'
      AND NOT trg.tgisinternal
  ) THEN
    EXECUTE '
      CREATE TRIGGER update_playground_test_results_updated_at
      BEFORE UPDATE ON public.playground_test_results
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column()
    ';
  END IF;
END$$;

-- Add comments for documentation
COMMENT ON TABLE  public.playground_test_results IS 'Stores test results for MCP server tools and ChatGPT Actions endpoints';
COMMENT ON COLUMN public.playground_test_results.type IS 'Type of test: mcp or chatgpt';
COMMENT ON COLUMN public.playground_test_results.tool_name IS 'Name of the tool or endpoint being tested';
COMMENT ON COLUMN public.playground_test_results.status IS 'Test result status: success or error';
COMMENT ON COLUMN public.playground_test_results.response_time IS 'Response time in milliseconds';
COMMENT ON COLUMN public.playground_test_results.error_message IS 'Error message if test failed';
COMMENT ON COLUMN public.playground_test_results.details IS 'Additional test details and metadata';

COMMIT;