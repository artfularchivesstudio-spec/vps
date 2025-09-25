-- Fix infinite recursion in admin_profiles RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON admin_profiles;

-- Create simpler, non-recursive policies
-- Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile" ON admin_profiles 
FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON admin_profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON admin_profiles 
FOR UPDATE USING (auth.uid() = id);

-- For the blog creation context, we need a way to verify admin status without recursion
-- Create a function that bypasses RLS for internal checks
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles 
    WHERE id = user_id
  );
$$;

-- Update blog_posts policy to use the function
DROP POLICY IF EXISTS "Admin users can manage blog posts" ON blog_posts;
CREATE POLICY "Admin users can manage blog posts" ON blog_posts 
FOR ALL USING (is_admin_user(auth.uid()));

-- Update other policies to use the function
DROP POLICY IF EXISTS "Admin users can manage media assets" ON media_assets;
CREATE POLICY "Admin users can manage media assets" ON media_assets 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to content revisions" ON content_revisions;
CREATE POLICY "Admin access to content revisions" ON content_revisions 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to generation sessions" ON generation_sessions;
CREATE POLICY "Admin access to generation sessions" ON generation_sessions 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to categories" ON categories;
CREATE POLICY "Admin access to categories" ON categories 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to post categories" ON post_categories;
CREATE POLICY "Admin access to post categories" ON post_categories 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to media categories" ON media_categories;
CREATE POLICY "Admin access to media categories" ON media_categories 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to tags" ON tags;
CREATE POLICY "Admin access to tags" ON tags 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to content tags" ON content_tags;
CREATE POLICY "Admin access to content tags" ON content_tags 
FOR ALL USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admin access to video metadata" ON video_metadata;
CREATE POLICY "Admin access to video metadata" ON video_metadata 
FOR ALL USING (is_admin_user(auth.uid()));