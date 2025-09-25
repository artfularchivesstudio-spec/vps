-- 🎭 **Fix Duplicate Table Entries** - Ensuring unique table identification across schemas ✨
-- This migration addresses the duplicate schema_migrations entries and ensures clean table listings

-- 🎨 **Drop existing function** to recreate with new return type
DROP FUNCTION IF EXISTS public.get_table_list();

-- 🎨 **Enhanced get_table_list function** - Now with schema-aware uniqueness
CREATE FUNCTION public.get_table_list()
RETURNS TABLE (
    table_name TEXT,
    table_type TEXT,
    schema_name TEXT,
    full_name TEXT  -- 🌟 Added for unique identification
)
AS $$
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
        n.nspname::TEXT as schema_name,
        (n.nspname || '.' || c.relname)::TEXT as full_name  -- 🎭 Unique identifier
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'v', 'm', 'f')
        AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        AND n.nspname !~ '^pg_'
        -- 🎨 Filter out duplicate entries by ensuring we only get unique schema.table combinations
        AND NOT (
            c.relname = 'schema_migrations' 
            AND n.nspname = 'public'
            AND EXISTS (
                SELECT 1 FROM pg_class c2 
                JOIN pg_namespace n2 ON n2.oid = c2.relnamespace 
                WHERE c2.relname = 'schema_migrations' 
                AND n2.nspname != 'public'
            )
        )
    ORDER BY n.nspname, c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🎼 **Create a simplified version** for backward compatibility
CREATE OR REPLACE FUNCTION public.get_unique_table_list()
RETURNS TABLE (
    table_name TEXT,
    table_type TEXT,
    schema_name TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
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
        AND c.relname NOT LIKE 'pg_%'
    ORDER BY n.nspname, c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🌟 **Grant permissions** for the enhanced functions
GRANT EXECUTE ON FUNCTION public.get_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_list() TO anon;
GRANT EXECUTE ON FUNCTION public.get_unique_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unique_table_list() TO anon;

-- ✨ **Add helpful comment** for future database explorers
COMMENT ON FUNCTION public.get_table_list() IS 'Database Explorer: Get unique table and view listings with schema information';