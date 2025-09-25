-- 🎭 **Database Explorer Functions** - The mystical toolkit for PostgreSQL exploration
-- Where database introspection becomes a beautiful art form

-- 🔧 **get_table_columns Function** - The column healer revealing schema architecture
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name TEXT)
RETURNS TABLE (
    column_name TEXT,
    data_type TEXT,
    is_nullable BOOLEAN,
    column_default TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.attname::TEXT as column_name,
        t.typname::TEXT as data_type,
        NOT a.attnotnull as is_nullable,
        pg_get_expr(d.adbin, d.adrelid)::TEXT as column_default
    FROM pg_catalog.pg_attribute a
    LEFT JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
    LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    LEFT JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = table_name
        AND n.nspname = 'public'
        AND a.attnum > 0
        AND NOT a.attisdropped
    ORDER BY a.attnum;
END;
$$;

-- 🎼 **execute_sql Function** - The query conductor with safety measures
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT, params JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    query_result RECORD;
    result_array JSONB := '[]'::jsonb;
BEGIN
    -- 🔒 Security checks - prevent dangerous operations
    IF sql ~* '\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE)\b' THEN
        RAISE EXCEPTION 'This query contains potentially dangerous operations';
    END IF;

    -- 🎵 Execute the query and collect results
    FOR query_result IN EXECUTE sql LOOP
        result_array := result_array || to_jsonb(query_result);
    END LOOP;

    -- 🎨 Return the results in our artistic format
    RETURN jsonb_build_object(
        'success', true,
        'data', result_array,
        'rowCount', jsonb_array_length(result_array),
        'timestamp', extract(epoch from now())
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'timestamp', extract(epoch from now())
        );
END;
$$;

-- 🌟 **Grant permissions for the mystical functions**
GRANT EXECUTE ON FUNCTION public.get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT, JSONB) TO anon;

-- 🎭 **Create a safe query wrapper for complex operations**
CREATE OR REPLACE FUNCTION public.safe_query(sql_query TEXT)
RETURNS TABLE (
    result JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 🔒 Additional security layer
    IF length(sql_query) > 10000 THEN
        RAISE EXCEPTION 'Query too long (max 10000 characters)';
    END IF;

    IF sql_query ~* '\b(PG_CATALOG|INFORMATION_SCHEMA)\b' THEN
        RAISE EXCEPTION 'Access to system catalogs not allowed';
    END IF;

    RETURN QUERY
    SELECT public.execute_sql(sql_query, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.safe_query(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_query(TEXT) TO anon;

-- ✨ **Add some helpful comments for future explorers**
COMMENT ON FUNCTION public.get_table_columns(TEXT) IS 'Database Explorer: Get detailed column information for a table';
COMMENT ON FUNCTION public.execute_sql(TEXT, JSONB) IS 'Database Explorer: Execute safe SQL queries with results';
COMMENT ON FUNCTION public.safe_query(TEXT) IS 'Database Explorer: Safe wrapper for SQL queries with additional security';
