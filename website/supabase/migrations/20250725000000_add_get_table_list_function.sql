-- Add get_table_list function for database introspection
CREATE OR REPLACE FUNCTION public.get_table_list()
RETURNS TABLE (
  table_name TEXT,
  table_type TEXT,
  schema_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::TEXT as table_name,
    CASE 
      WHEN c.relkind = 'r' THEN 'table'
      WHEN c.relkind = 'v' THEN 'view'
      WHEN c.relkind = 'm' THEN 'materialized_view'
      WHEN c.relkind = 'f' THEN 'foreign_table'
      ELSE 'unknown'
    END::TEXT as table_type,
    n.nspname::TEXT as schema_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'v', 'm', 'f')
    AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND n.nspname !~ '^pg_'
  ORDER BY n.nspname, c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_list() TO anon;
