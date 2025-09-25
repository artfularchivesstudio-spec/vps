import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const searchParams = request.nextUrl.searchParams
  const by = searchParams.get('by') || 'id' // 'id' | 'slug'
  const idOrSlug = params.id

  try {
    // 1) Fetch post by id or slug
    let postQuery = supabase.from('blog_posts').select('*').limit(1)
    if (by === 'slug') {
      postQuery = postQuery.eq('slug', idOrSlug)
    } else {
      postQuery = postQuery.eq('id', idOrSlug)
    }
    const { data: posts, error: postErr } = await postQuery
    if (postErr) throw postErr
    const post = posts?.[0]
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }

    // 2) Fetch latest audio job (if any) for this post
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

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('full-preview error:', e)
    return NextResponse.json({ error: 'Failed to load preview' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}


