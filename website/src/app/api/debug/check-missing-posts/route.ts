import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get search parameters
    const searchParams = request.nextUrl.searchParams
    const searchTerm = searchParams.get('search') || 'fallen tree'
    
    // Search for posts with various criteria
    const queries = [
      // Search by title
      supabase
        .from('blog_posts')
        .select('id, title, slug, status, origin_source, created_at, created_by, published_at')
        .ilike('title', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Search by slug
      supabase
        .from('blog_posts')
        .select('id, title, slug, status, origin_source, created_at, created_by, published_at')
        .ilike('slug', `%${searchTerm.toLowerCase().replace(/\s+/g, '-')}%`)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Search by content
      supabase
        .from('blog_posts')
        .select('id, title, slug, status, origin_source, created_at, created_by, published_at')
        .ilike('content', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Get all recent posts regardless of created_by
      supabase
        .from('blog_posts')
        .select('id, title, slug, status, origin_source, created_at, created_by, published_at')
        .order('created_at', { ascending: false })
        .limit(20)
    ]
    
    const results = await Promise.all(queries)
    
    // Check for orphaned media assets
    const { data: audioAssets } = await supabase
      .from('media_assets')
      .select('id, title, file_path, created_at, metadata')
      .or(`title.ilike.%${searchTerm}%,metadata->title.ilike.%${searchTerm}%`)
      .eq('asset_type', 'audio')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Check API keys usage
    const { data: apiKeys } = await supabase
      .from('external_api_keys')
      .select('id, name, last_used, created_by')
      .eq('is_active', true)
      .order('last_used', { ascending: false })
      .limit(5)
    
    // Check recent API request logs
    const { data: recentLogs } = await supabase
      .from('api_request_logs')
      .select('id, method, path, status_code, created_at, api_key_id')
      .order('created_at', { ascending: false })
      .limit(20)
    
    return Response.json({
      success: true,
      searchTerm,
      results: {
        byTitle: results[0].data || [],
        bySlug: results[1].data || [],
        byContent: results[2].data || [],
        recentPosts: results[3].data || [],
        orphanedAudio: audioAssets || [],
        activeApiKeys: apiKeys || [],
        recentApiCalls: recentLogs || []
      },
      summary: {
        totalPostsFound: [
          ...(results[0].data || []),
          ...(results[1].data || []),
          ...(results[2].data || [])
        ].filter((post, index, self) => 
          index === self.findIndex((p) => p.id === post.id)
        ).length,
        orphanedAudioCount: audioAssets?.length || 0,
        activeApiKeysCount: apiKeys?.length || 0
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Debug check error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to fix missing posts
export async function POST(request: NextRequest) {
  try {
    // Use service client to bypass RLS for recovery
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { title, content, slug, imageUrl, audioUrl } = body

    // Generate slug for post
    const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
    // Check for existing posts with this slug to merge duplicates
    const { data: existingPosts, error: existingError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', postSlug);
    if (existingError) {
      console.error('Error checking existing posts:', existingError);
    }
    if (existingPosts && existingPosts.length > 0) {
      const keepPost = existingPosts[0];
      // Update existing post with new content and featured image
      const { data: updatedPost, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          content,
          featured_image_url:
            imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('chatgpt.com') && !imageUrl.startsWith('sandbox:')
              ? imageUrl
              : keepPost.featured_image_url,
          status: 'published',
          ai_analysis_openai: 'Recovered from ChatGPT conversation',
          generation_metadata: {
            recovered: true,
            recoveredAt: new Date().toISOString(),
            source: 'ChatGPT Actions Recovery',
            originalImageUrl: imageUrl,
            imageNote:
              imageUrl.includes('chatgpt.com') || imageUrl.startsWith('sandbox:')
                ? 'Image from ChatGPT - not directly usable in Next.js Image component'
                : null
          }
        })
        .eq('id', keepPost.id)
        .select()
        .single();
      // Handle audio asset for existing post
      if (audioUrl) {
        // Remove old audio if exists
        if (keepPost.primary_audio_id) {
          await supabase.from('media_assets').delete().eq('id', keepPost.primary_audio_id);
        }
        const { data: audioAsset, error: audioError } = await supabase
          .from('media_assets')
          .insert({
            title: `Audio for: ${title}`,
            asset_type: 'audio',
            file_path: audioUrl,
            mime_type: 'audio/mpeg',
            metadata: { postId: keepPost.id, recovered: true }
          })
          .select()
          .single();
        if (audioAsset) {
          await supabase.from('blog_posts').update({ primary_audio_id: audioAsset.id }).eq('id', keepPost.id);
        }
      }
      // Delete any duplicate posts beyond the first
      if (existingPosts.length > 1) {
        const duplicateIds = existingPosts.slice(1).map((p: any) => p.id);
        await supabase.from('blog_posts').delete().in('id', duplicateIds);
      }
      return Response.json({
        success: true,
        post: updatedPost || keepPost,
        message: 'Post recovered and merged duplicates successfully'
      }, { status: 200 });
    }
    
    if (!title || !content) {
      return Response.json({
        success: false,
        error: 'Title and content are required'
      }, { status: 400 })
    }
    
    // Create the post with proper attribution
    const postData = {
      title,
      slug: postSlug,
      content,
      excerpt: content.substring(0, 160) + '...',
      featured_image_url: imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('chatgpt.com') && !imageUrl.startsWith('sandbox:') ? imageUrl : null,
      status: 'published',
      origin_source: 'openai', // Use 'openai' as it's a valid enum value for ChatGPT
      published_at: new Date().toISOString(),
      created_by: null, // No user association for recovered posts
      ai_analysis_openai: 'Recovered from ChatGPT conversation',
      generation_metadata: {
        recovered: true,
        recoveredAt: new Date().toISOString(),
        source: 'ChatGPT Actions Recovery',
        originalImageUrl: imageUrl, // Store original URL for reference
        imageNote: imageUrl.includes('chatgpt.com') || imageUrl.startsWith('sandbox:') ? 'Image from ChatGPT - not directly usable in Next.js Image component' : null
      }
    }
    
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single()
    
    if (postError) {
      return Response.json({
        success: false,
        error: postError.message
      }, { status: 500 })
    }
    
    // If audio URL provided, create media asset
    if (audioUrl && post) {
      const { data: audioAsset, error: audioError } = await supabase
        .from('media_assets')
        .insert({
          title: `Audio for: ${title}`,
          asset_type: 'audio',
          file_path: audioUrl,
          mime_type: 'audio/mpeg',
          metadata: {
            postId: post.id,
            recovered: true
          }
        })
        .select()
        .single()
      
      if (audioAsset && !audioError) {
        // Link audio to post
        await supabase
          .from('blog_posts')
          .update({ primary_audio_id: audioAsset.id })
          .eq('id', post.id)
      }
    }
    
    return Response.json({
      success: true,
      post,
      message: 'Post recovered successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Recovery error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}