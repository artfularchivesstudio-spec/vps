declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const by = url.searchParams.get('by') || 'id'
    const idOrSlug = url.pathname.split('/').pop() || ''

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)

    let postQuery = supabase.from('blog_posts').select('*').limit(1)
    if (by === 'slug') postQuery = postQuery.eq('slug', idOrSlug)
    else postQuery = postQuery.eq('id', idOrSlug)

    let { data: posts, error: postErr } = await postQuery
    if (postErr) throw postErr
    let post = posts?.[0]
    // Fallback: if not found and by=id, try slug
    if (!post && by !== 'slug') {
      const { data: bySlug, error: slugErr } = await supabase.from('blog_posts').select('*').eq('slug', idOrSlug).limit(1)
      if (slugErr) throw slugErr
      post = bySlug?.[0]
    }
    if (!post) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: jobs, error: jobErr } = await supabase
      .from('audio_jobs')
      .select('id,status,audio_url,audio_urls,language_statuses,updated_at,created_at')
      .eq('post_id', post.id)
      .order('updated_at', { ascending: false })
      .limit(1)
    if (jobErr) throw jobErr
    const job = jobs?.[0] || null

    const payload = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      featured_image_url: post.featured_image_url,
      audio: job ? {
        job_id: job.id,
        status: job.status,
        audio_url: (job as any).audio_url || null,
        audio_urls: (job as any).audio_urls || null,
        language_statuses: (job as any).language_statuses || null,
        updated_at: job.updated_at,
      } : null,
      updated_at: post.updated_at,
      created_at: post.created_at,
    }

    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
