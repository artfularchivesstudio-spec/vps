# 🎭 Artful Archives Studio Website

A Next.js website for showcasing artistic archives, blog posts, and multimedia content.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
4. Update the environment variables with your Supabase credentials
5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🛠️ Troubleshooting

### Blog Post Loading Issues (403 Forbidden)

If you encounter 403 Forbidden errors when loading blog posts, follow these steps:

1. Ensure you have a proper `.env.local` file with valid Supabase credentials
2. Run the fix script to apply the necessary RLS policy fixes:
   ```bash
   ./scripts/fix-blog-access.sh
   ```
3. If issues persist, check the Supabase dashboard for any RLS policy conflicts

#### Manual Fix

If the script doesn't work, you can manually apply the fix:

1. Navigate to your Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL:
   ```sql
   -- Enable RLS on blog_posts table
   ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

   -- Create policy for public read access
   CREATE POLICY "Public can read published blog posts" 
       ON public.blog_posts
       FOR SELECT 
       USING (status = 'published');

   -- Create policy for authenticated users
   CREATE POLICY "Authenticated users can read all blog posts" 
       ON public.blog_posts
       FOR SELECT 
       TO authenticated
       USING (true);
   ```

## 📝 License

Copyright © 2025 Artful Archives Studio. All rights reserved.