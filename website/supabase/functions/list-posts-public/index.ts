// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

// Helper function to create standardized responses
function createResponse(data: any, error: string | undefined, meta?: any) {
  const response = {
    success: !error,
    data,
    error,
    meta
  };
  let status = 200;
  if (error) {
    if (error === 'Unauthorized') {
      status = 401;
    } else if (error === 'Not Found') {
      status = 404;
    } else {
      status = 500;
    }
  }
  return new Response(JSON.stringify(response), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status
  });
}

// GET /list-posts-public - List publicly accessible blog posts
async function handleListPostsPublic(req: Request) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
  const search = url.searchParams.get('search');
  const orderBy = url.searchParams.get('order_by') || 'published_at'; // Order by published_at for public
  const orderDirection = url.searchParams.get('order_direction') || 'desc';

  // Use the public anon key for publicly accessible data
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '' // Use ANON KEY
  );

  try {
    let query = supabase.from('blog_posts')
      .select(`
        id, title, slug, excerpt, content, featured_image_url,
        seo_title, seo_description, status, origin_source,
        created_at, updated_at, published_at, primary_audio_id
      `, { count: 'exact' })
      .eq('status', 'published'); // Only show published posts publicly

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    query = query.order(orderBy, { ascending: orderDirection === 'asc' })
                 .range((page - 1) * limit, page * limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching public posts:', error);
      return createResponse(undefined, 'Failed to fetch public posts');
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return createResponse({ posts }, undefined, {
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error in handleListPostsPublic:', error);
    return createResponse(undefined, 'Internal server error');
  }
}

// Main handler for the Edge Function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return await handleListPostsPublic(req);
  } else {
    return createResponse(undefined, 'Method not allowed', { status: 405 });
  }
});
