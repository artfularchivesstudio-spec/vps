declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// 🚫 Authentication disabled for pre-prod; beware of party crashers 🎈
// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
    try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    if (req.method === 'GET') {
      // List posts
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const page = parseInt(url.searchParams.get('page') || '1');
      const status = url.searchParams.get('status');
      let query = supabase.from('blog_posts').select(`
          id, title, slug, excerpt, content, featured_image_url,
          seo_title, seo_description, status, origin_source,
          created_at, updated_at, published_at
        `).order('created_at', {
        ascending: false
      }).range((page - 1) * limit, page * limit - 1);
      if (status) {
        query = query.eq('status', status);
      }
      const { data: posts, error, count } = await query;
      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      console.log(`📚 Retrieved ${posts?.length || 0} posts (page ${page})`);
      return new Response(JSON.stringify({
        success: true,
        data: {
          posts: posts || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (req.method === 'POST') {
      // Create post
      const body = await req.json();
      if (!body.title || !body.content) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields: title and content'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const postData = {
        title: body.title,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: body.content,
        excerpt: body.excerpt || body.content.substring(0, 160) + '...',
        status: body.status || 'draft',
        origin_source: 'manual',
        featured_image_url: body.featured_image_url || null,
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null
      };
      const { data: post, error } = await supabase.from('blog_posts').insert(postData).select().single();
      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      console.log(`🐶 Created post: "${post.title}" (ID: ${post.id})`);
      return new Response(JSON.stringify({
        success: true,
        data: post
      }), {
        status: 201,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Method not allowed
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`🚨 Error processing request: ${error.message}`);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 