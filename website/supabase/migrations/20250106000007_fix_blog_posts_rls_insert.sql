-- Fix RLS policy for blog_posts INSERT operations

-- Drop the current policy that's causing issues
DROP POLICY IF EXISTS "Admin users can manage blog posts" ON blog_posts;

-- Create separate policies for different operations
-- SELECT policy - allow admins to read all posts
CREATE POLICY "Admin users can read blog posts" ON blog_posts 
FOR SELECT USING (is_admin_user(auth.uid()));

-- INSERT policy - allow admins to create posts
CREATE POLICY "Admin users can insert blog posts" ON blog_posts 
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND 
  is_admin_user(auth.uid())
);

-- UPDATE policy - allow admins to update posts
CREATE POLICY "Admin users can update blog posts" ON blog_posts 
FOR UPDATE USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- DELETE policy - allow admins to delete posts
CREATE POLICY "Admin users can delete blog posts" ON blog_posts 
FOR DELETE USING (is_admin_user(auth.uid()));

-- Also, let's make the is_admin_user function more robust
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN user_id IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = user_id
    )
  END;
$$;