import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BlogPost } from '@/types/blog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 📨 Posts Proxy - slides CRUD wishes to the `posts` edge function 
 * so the admin dashboard can stay blissfully brainless 😌🍃
 * 
 * Enhanced to handle audio_assets_by_language updates with media asset creation
 */
async function proxy(req: NextRequest) {
  const url = new URL(req.url)
  const method = req.method
  const target = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/posts${url.search}`

  const res = await fetch(target, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: ['GET','HEAD'].includes(method) ? undefined : await req.text()
  })
  const data = await res.text()
  return new NextResponse(data, { status: res.status })
}

/**
 * Handle PUT requests with audio_assets_by_language updates
 */
async function handleAudioUpdate(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const postId = url.searchParams.get('id')

    if (!postId) {
      return new NextResponse(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { audio_assets_by_language, ...otherFields } = body

    // If no audio assets provided, use regular proxy
    if (!audio_assets_by_language || typeof audio_assets_by_language !== 'object') {
      return proxy(req)
    }

    console.log(`🎵 Processing audio assets update for post ${postId}`)

    // Validate and create media assets for each language
    const validatedAssets: Record<string, string> = {}

    for (const [lang, assetData] of Object.entries(audio_assets_by_language)) {
      if (typeof assetData === 'string') {
        // Direct URL provided - create media asset
        const assetId = await createOrFindMediaAsset(assetData, lang, postId)
        if (assetId) {
          validatedAssets[lang] = assetId
        }
      } else if (typeof assetData === 'object' && assetData !== null) {
        // Asset object with metadata
        const { url, metadata } = assetData as any
        if (url) {
          const assetId = await createOrFindMediaAsset(url, lang, postId, metadata)
          if (assetId) {
            validatedAssets[lang] = assetId
          }
        }
      }
    }

    // Update the blog post with validated audio assets
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        audio_assets_by_language: validatedAssets,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Failed to update blog post audio assets:', updateError)
      return new NextResponse(JSON.stringify({ error: 'Failed to update audio assets' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // If there are other fields to update, proxy to the original function
    if (Object.keys(otherFields).length > 0) {
      const proxyBody = { ...otherFields }
      const proxyReq = new Request(req.url, {
        method: 'PUT',
        headers: req.headers,
        body: JSON.stringify(proxyBody)
      })
      return proxy(proxyReq as any)
    }

    // Return success response
    return new NextResponse(JSON.stringify({
      success: true,
      message: `Updated audio assets for ${Object.keys(validatedAssets).length} languages`,
      audio_assets_by_language: validatedAssets
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Audio update error:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Create or find existing media asset for audio URL
 */
async function createOrFindMediaAsset(
  audioUrl: string,
  language: string,
  postId: string,
  metadata?: any
): Promise<string | null> {
  try {
    // Check if media asset already exists
    const { data: existingAsset } = await supabase
      .from('media_assets')
      .select('id')
      .eq('file_url', audioUrl)
      .eq('metadata->>language', language)
      .single()

    if (existingAsset) {
      console.log(`📁 Found existing media asset for ${language}: ${existingAsset.id}`)
      return existingAsset.id
    }

    // Create new media asset
    const assetMetadata = {
      language,
      post_id: postId,
      source: 'api_update',
      created_via: 'admin_api',
      ...metadata
    }

    const { data: newAsset, error: assetError } = await supabase
      .from('media_assets')
      .insert({
        file_url: audioUrl,
        file_type: 'audio',
        metadata: assetMetadata
      })
      .select('id')
      .single()

    if (assetError) {
      console.error(`Failed to create media asset for ${language}:`, assetError)
      return null
    }

    console.log(`✅ Created new media asset for ${language}: ${newAsset.id}`)
    return newAsset.id

  } catch (error) {
    console.error(`Error handling media asset for ${language}:`, error)
    return null
  }
}

export const GET = proxy
export const POST = proxy

export async function PUT(req: NextRequest) {
  const body = await req.clone().json().catch(() => ({}))
  
  // Check if this is an audio assets update
  if (body.audio_assets_by_language) {
    return handleAudioUpdate(req)
  }
  
  // Otherwise, use the regular proxy
  return proxy(req)
}

export const DELETE = proxy
