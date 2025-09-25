import { authenticateRequest } from '@/lib/auth/dual-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const supabase = authResult.supabaseClient
    const body = await request.json().catch(() => ({})) as { post_ids?: string[] }
    const postIds = Array.isArray(body?.post_ids) ? body.post_ids.filter(Boolean) : []

    if (postIds.length === 0) {
      return NextResponse.json({ error: 'post_ids required' }, { status: 400 })
    }

    // Select audio_urls (JSONB) in addition to audio_url for multilingual support
    const { data, error } = await supabase
      .from('audio_jobs')
      .select('id,status,updated_at,post_id,audio_url,audio_urls,processed_chunks,total_chunks,completed_languages')
      .in('post_id', postIds)
      .order('updated_at', { ascending: false })

    // Debug logging to help diagnose language counting issues
    console.log(`🔍 Audio jobs batch-status query:`)
    console.log(`  - Requested post_ids: [${postIds.join(', ')}]`)
    console.log(`  - Found ${data?.length || 0} audio jobs`)
    if (data?.length) {
      console.log(`  - Sample job:`, {
        id: data[0].id,
        status: data[0].status,
        completed_languages: (data[0] as any).completed_languages,
        audio_urls_count: Object.keys((data[0] as any).audio_urls || {}).length,
        audio_urls: (data[0] as any).audio_urls
      })
    }

    if (error) {
      console.error('batch-status query error:', error)
      return NextResponse.json({ error: 'Failed to fetch job statuses' }, { status: 500 })
    }

    const results: Record<string, {
      id: string,
      status: string,
      progress?: number | null,
      updated_at?: string | null,
      audio_url?: string | null,
      languages?: string[],
      audio_urls?: Record<string, string>,
      completed_languages?: string[]
    }> = {}

    for (const row of data || []) {
      if (!results[row.post_id]) {
        const processed = (row as any).processed_chunks ?? 0
        const total = (row as any).total_chunks ?? 0
        const progress = total > 0 ? Math.round((processed / total) * 100) : null

        // Get audio URL - prioritize audio_urls (multilingual) over audio_url (single)
        let audioUrl = (row as any).audio_url ?? null
        const audioUrls = (row as any).audio_urls as Record<string, string> | null
        const completedLanguages = (row as any).completed_languages as string[] | null

        // If we have multilingual audio URLs, use the first completed one
        if (audioUrls && typeof audioUrls === 'object' && completedLanguages?.length) {
          const primaryLanguage = completedLanguages[0] || 'en'
          audioUrl = audioUrls[primaryLanguage] || Object.values(audioUrls)[0] || audioUrl
        }

        results[row.post_id] = {
          id: row.id as string,
          status: row.status as string,
          progress,
          updated_at: (row as any).updated_at ?? null,
          audio_url: audioUrl,
          languages: completedLanguages || [],
          audio_urls: audioUrls || {},
          completed_languages: completedLanguages || []
        }
      }
    }

    return NextResponse.json({ results })
  } catch (e) {
    console.error('batch-status exception:', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST with { post_ids: string[] }' }, { status: 405 })
}

