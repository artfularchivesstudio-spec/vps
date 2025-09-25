CREATE OR REPLACE FUNCTION public.get_table_list()
RETURNS TABLE (
    table_name TEXT,
    table_type TEXT,
    schema_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.relname::TEXT AS table_name,
        CASE c.relkind
            WHEN 'r' THEN 'table'
            WHEN 'v' THEN 'view'
            WHEN 'm' THEN 'materialized_view'
            ELSE 'other'
        END AS table_type,
        n.nspname::TEXT AS schema_name
    FROM
        pg_catalog.pg_class c
    JOIN
        pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE
        c.relkind IN ('r', 'v', 'm')
        AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'extensions', 'private', 'auth', 'storage', 'graphql', 'graphql_public')
    ORDER BY
        n.nspname, c.relname;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_table_list() TO authenticated;
