-- Fix permissions for the get_table_list function
-- The function already exists with a different signature than expected, so we just need to ensure proper permissions

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION get_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_list() TO anon;

-- Ensure tables have appropriate permissions
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON blog_posts TO authenticated;
GRANT SELECT ON media_assets TO anon;
GRANT SELECT ON media_assets TO authenticated;