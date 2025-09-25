import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// 🎭 The Spellbinding Posts Curator
// Guardian of all things content and audio in our digital storytelling gallery!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// 🎨 Error Response Interface - Our Safety Net
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    status: number;
    timestamp: string;
    requestId?: string;
  };
}

// 📝 Post Data Interface - The Blueprint of Our Digital Stories
interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  status: 'draft' | 'published' | 'archived';
  origin_source: string;
  content_version: number;
  title_translations?: Record<string, string>;
  content_translations?: Record<string, string>;
  excerpt_translations?: Record<string, string>;
  created_at: string;
  updated_at: string;
  published_at?: string;
  primary_audio_id?: string;
  created_by?: string;
  last_edited_by?: string;
}

// 🎼 The Grand Posts Handler - Our Master Storyteller
Deno.serve(async (req) => {
  // 🎭 CORS Support - Welcoming All Visitors
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // 🎯 Route the Performance - Direct Each Request to Its Proper Exhibition Room
    switch (method) {
      case 'GET':
        if (pathParts.length === 1) {
          // GET /posts - List all posts
          return await listPosts(req);
        } else if (pathParts.length === 2) {
          // GET /posts/{id} - Get specific post
          const postId = pathParts[1];
          return await getPost(req, postId);
        } else if (pathParts.length === 3 && pathParts[2] === 'audio-assets') {
          // GET /posts/{id}/audio-assets - Get audio assets for post
          const postId = pathParts[1];
          return await getPostAudioAssets(req, postId);
        }
        break;

      case 'POST':
        if (pathParts.length === 1) {
          // POST /posts - Create new post
          return await createPost(req);
        }
        break;

      case 'PUT':
        if (pathParts.length === 2) {
          // PUT /posts/{id} - Update post
          const postId = pathParts[1];
          return await updatePost(req, postId);
        } else if (pathParts.length === 3 && pathParts[2] === 'primary-audio') {
          // PUT /posts/{id}/primary-audio - Set primary audio for post
          const postId = pathParts[1];
          return await setPostPrimaryAudio(req, postId);
        }
        break;

      case 'DELETE':
        if (pathParts.length === 2) {
          // DELETE /posts/{id} - Delete post
          const postId = pathParts[1];
          return await deletePost(req, postId);
        }
        break;
    }

    // 🎪 Route Not Found - The Show Must Go On!
    return createErrorResponse('ROUTE_NOT_FOUND', 'The requested posts route does not exist', 404);

  } catch (error) {
    console.error('[posts] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500, error);
  }
});

// 🎭 List Posts - Browse Our Digital Storytelling Gallery
async function listPosts(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const orderBy = url.searchParams.get('order_by') || 'created_at';
    const orderDirection = url.searchParams.get('order_direction') || 'desc';

    let query = supabase
      .from('blog_posts')
      .select('*')
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('[listPosts] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve posts', 500, error);
    }

    // 🎨 Enrich posts with audio data
    const enrichedPosts = await Promise.all((posts || []).map(async (post) => {
      return await enrichPostWithAudioData(post);
    }));

    return new Response(JSON.stringify({
      success: true,
      data: enrichedPosts,
      pagination: {
        limit,
        offset,
        hasMore: enrichedPosts.length === limit,
        total: count || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[listPosts] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to list posts', 500, error);
  }
}

// 🎨 Get Post - Inspect a Specific Digital Masterpiece
async function getPost(req: Request, postId: string) {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      console.error('[getPost] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve post', 500, error);
    }

    // 🎨 Enrich post with audio data
    const enrichedPost = await enrichPostWithAudioData(post);

    return new Response(JSON.stringify({
      success: true,
      data: enrichedPost
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[getPost] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get post', 500, error);
  }
}

// 🎵 Get Post Audio Assets - Explore the Audio Gallery of a Post
async function getPostAudioAssets(req: Request, postId: string) {
  try {
    // 🎭 Verify post exists
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title')
      .eq('id', postId)
      .single();

    if (postError) {
      if (postError.code === 'PGRST116') {
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to verify post', 500, postError);
    }

    // 🎼 Get audio jobs for this post
    const { data: audioJobs, error: jobsError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('[getPostAudioAssets] Audio jobs error:', jobsError);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve audio jobs', 500, jobsError);
    }

    // 🖼️ Get media assets for this post
    const { data: mediaAssets, error: assetsError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('related_post_id', postId)
      .eq('file_type', 'audio')
      .order('created_at', { ascending: false });

    if (assetsError) {
      console.error('[getPostAudioAssets] Media assets error:', assetsError);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve media assets', 500, assetsError);
    }

    // 🎨 Find primary audio
    const primaryAudio = mediaAssets?.find(asset => asset.id === post.primary_audio_id) || null;

    return new Response(JSON.stringify({
      success: true,
      data: {
        post_id: postId,
        post_title: post.title,
        audio_jobs: audioJobs || [],
        media_assets: mediaAssets || [],
        primary_audio: primaryAudio,
        summary: {
          total_jobs: audioJobs?.length || 0,
          total_assets: mediaAssets?.length || 0,
          completed_jobs: audioJobs?.filter(job => job.status === 'completed').length || 0,
          failed_jobs: audioJobs?.filter(job => job.status === 'failed').length || 0
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[getPostAudioAssets] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get post audio assets', 500, error);
  }
}

// 🎵 Create Post - Birth a New Digital Story
async function createPost(req: Request) {
  try {
    const body = await req.json();

    // 🎭 Validate Input - Ensure Our Creation Has All Required Elements
    const requiredFields = ['title', 'content'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse('VALIDATION_ERROR', `Missing required field: ${field}`, 400);
      }
    }

    // 🎨 Prepare Post Data - Craft Our Digital Masterpiece
    const postData = {
      title: body.title,
      slug: body.slug || generateSlug(body.title),
      content: body.content,
      excerpt: body.excerpt || generateExcerpt(body.content),
      featured_image_url: body.featured_image_url,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      status: body.status || 'draft',
      origin_source: body.origin_source || 'api',
      ai_analysis_openai: body.ai_analysis_openai,
      ai_analysis_claude: body.ai_analysis_claude,
      generation_metadata: body.generation_metadata,
      selected_ai_provider: body.selected_ai_provider,
      content_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(body.publish_immediately && body.status === 'published' && {
        published_at: new Date().toISOString()
      })
    };

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error('[createPost] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to create post', 500, error);
    }

    // 🎨 Handle categories and tags if provided
    await handlePostRelations(post.id, body.categories, body.tags);

    // 🎨 Enrich post with audio data
    const enrichedPost = await enrichPostWithAudioData(post);

    return new Response(JSON.stringify({
      success: true,
      data: enrichedPost
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[createPost] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create post', 500, error);
  }
}

// 🎨 Update Post - Polish and Perfect Our Digital Masterpiece
async function updatePost(req: Request, postId: string) {
  try {
    const body = await req.json();

    // 🎭 Verify post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch post', 500, fetchError);
    }

    // 🎨 Prepare Update Data - Refine Our Curated Piece
    const contentChanged = body.content && body.content !== existingPost.content;
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...(body.slug && { slug: body.slug }),
      ...(body.title && { title: body.title }),
      ...(body.content && { content: body.content }),
      ...(body.excerpt && { excerpt: body.excerpt }),
      ...(body.featured_image_url !== undefined && { featured_image_url: body.featured_image_url }),
      ...(body.seo_title !== undefined && { seo_title: body.seo_title }),
      ...(body.seo_description !== undefined && { seo_description: body.seo_description }),
      ...(body.status && { status: body.status }),
      ...(body.ai_analysis_openai !== undefined && { ai_analysis_openai: body.ai_analysis_openai }),
      ...(body.ai_analysis_claude !== undefined && { ai_analysis_claude: body.ai_analysis_claude }),
      ...(body.generation_metadata !== undefined && { generation_metadata: body.generation_metadata }),
      ...(body.selected_ai_provider !== undefined && { selected_ai_provider: body.selected_ai_provider }),
      ...(contentChanged && { content_version: (existingPost.content_version || 1) + 1 }),
      ...(body.publish_immediately && body.status === 'published' && !existingPost.published_at && {
        published_at: new Date().toISOString()
      })
    };

    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to update post', 500, updateError);
    }

    // 🎨 Handle categories and tags if provided
    if (body.categories || body.tags) {
      await handlePostRelations(postId, body.categories, body.tags, true);
    }

    // 🎵 Mark audio jobs as stale if content changed
    let audioMarkedStale = 0;
    if (contentChanged) {
      const { count } = await supabase
        .from('audio_jobs')
        .update({ is_stale: true })
        .eq('post_id', postId)
        .select('id', { count: 'exact' });
      audioMarkedStale = count || 0;
    }

    // 🎨 Enrich post with audio data
    const enrichedPost = await enrichPostWithAudioData(updatedPost);

    return new Response(JSON.stringify({
      success: true,
      data: { ...enrichedPost, audio_marked_stale: audioMarkedStale }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[updatePost] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update post', 500, error);
  }
}

// 🎵 Set Post Primary Audio - Crown the Main Melody
async function setPostPrimaryAudio(req: Request, postId: string) {
  try {
    const body = await req.json();

    // 🎭 Validate Input
    if (!body.audio_asset_id) {
      return createErrorResponse('VALIDATION_ERROR', 'Missing required field: audio_asset_id', 400);
    }

    // 🎨 Verify post exists
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title')
      .eq('id', postId)
      .single();

    if (postError) {
      if (postError.code === 'PGRST116') {
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to verify post', 500, postError);
    }

    // 🎵 Verify audio asset exists and belongs to this post
    const { data: audioAsset, error: assetError } = await supabase
      .from('media_assets')
      .select('id, title, file_type')
      .eq('id', body.audio_asset_id)
      .eq('related_post_id', postId)
      .eq('file_type', 'audio')
      .single();

    if (assetError) {
      if (assetError.code === 'PGRST116') {
        return createErrorResponse('AUDIO_ASSET_NOT_FOUND', 'Audio asset not found or does not belong to this post', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to verify audio asset', 500, assetError);
    }

    // 🎨 Update post with primary audio
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({ primary_audio_id: body.audio_asset_id })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to set primary audio', 500, updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        post_id: postId,
        primary_audio_id: body.audio_asset_id,
        audio_asset: audioAsset
      },
      message: 'Primary audio set successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[setPostPrimaryAudio] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to set primary audio', 500, error);
  }
}

// 🗑️ Delete Post - Send to the Digital Archives
async function deletePost(req: Request, postId: string) {
  try {
    // 🎭 Verify post exists
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title')
      .eq('id', postId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch post', 500, fetchError);
    }

    // 🎨 Clean up related data
    await Promise.all([
      // Delete post categories
      supabase.from('post_categories').delete().eq('blog_post_id', postId),
      // Delete content tags
      supabase.from('content_tags').delete().eq('content_id', postId).eq('content_type', 'blog_post'),
      // Delete related media assets (this will also clean up files via the media-assets function)
      supabase.from('media_assets').delete().eq('related_post_id', postId),
      // Delete audio jobs
      supabase.from('audio_jobs').delete().eq('post_id', postId)
    ]);

    // 🗑️ Delete the post
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to delete post', 500, deleteError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Post and all related data deleted successfully',
      post_id: postId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[deletePost] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete post', 500, error);
  }
}

// 🎨 Helper Functions - Our Curatorial Assistants

// 🎨 Enrich Post with Audio Data - Add the Musical Dimension
async function enrichPostWithAudioData(post: any) {
  try {
    // 🎼 Get audio jobs
    const { data: audioJobs } = await supabase
      .from('audio_jobs')
      .select('is_stale, completed_languages, audio_urls')
      .eq('post_id', post.id);

    // 🖼️ Get media assets
    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select('id, title, file_url, file_type, status, created_at')
      .eq('related_post_id', post.id);

    // 🎵 Find primary audio
    const primaryAudio = mediaAssets?.find(asset => asset.id === post.primary_audio_id) || null;

    // 🎨 Calculate audio status
    const audioIsStale = (audioJobs || []).some(job => job.is_stale);
    const completedLanguages = audioJobs?.flatMap(job => job.completed_languages || []) || [];
    const audioUrls = audioJobs?.reduce((acc, job) => ({ ...acc, ...job.audio_urls }), {}) || {};

    return {
      ...post,
      type: 'blog',
      audio_jobs: audioJobs || [],
      media_assets: mediaAssets || [],
      primary_audio: primaryAudio,
      audio_is_stale: audioIsStale,
      completed_languages: completedLanguages,
      audio_urls: audioUrls,
      text_languages: getTextLanguages(post),
      audio_languages: getAudioLanguages(audioJobs || [])
    };
  } catch (error) {
    console.error('[enrichPostWithAudioData] Error:', error);
    return post; // Return original post if enrichment fails
  }
}

// 🎨 Handle Post Relations - Connect Categories and Tags
async function handlePostRelations(postId: string, categories?: string[], tags?: string[], clearExisting = false) {
  try {
    if (clearExisting) {
      // Clear existing relations
      await Promise.all([
        supabase.from('post_categories').delete().eq('blog_post_id', postId),
        supabase.from('content_tags').delete().eq('content_id', postId).eq('content_type', 'blog_post')
      ]);
    }

    // Handle categories
    if (categories?.length) {
      for (const categoryName of categories) {
        // Find or create category
        let { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .single();

        if (!category) {
          // Create new category
          const { data: newCategory } = await supabase
            .from('categories')
            .insert({ name: categoryName, slug: generateSlug(categoryName) })
            .select('id')
            .single();
          category = newCategory;
        }

        if (category) {
          await supabase
            .from('post_categories')
            .insert({ blog_post_id: postId, category_id: category.id });
        }
      }
    }

    // Handle tags
    if (tags?.length) {
      for (const tagName of tags) {
        // Find or create tag
        let { data: tag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();

        if (!tag) {
          // Create new tag
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ name: tagName, slug: generateSlug(tagName) })
            .select('id')
            .single();
          tag = newTag;
        }

        if (tag) {
          await supabase
            .from('content_tags')
            .insert({ content_id: postId, tag_id: tag.id, content_type: 'blog_post' });
        }
      }
    }
  } catch (error) {
    console.error('[handlePostRelations] Error:', error);
    // Don't throw - relations are not critical for post creation
  }
}

// 🎨 Utility Functions - Our Creative Tools
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateExcerpt(content: string, maxLength = 160): string {
  const text = content.replace(/<[^>]*>/g, '').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function getTextLanguages(post: any): string[] {
  const languages = ['en']; // Default to English
  if (post.title_translations) {
    Object.keys(post.title_translations).forEach(lang => {
      if (!languages.includes(lang)) languages.push(lang);
    });
  }
  return languages;
}

function getAudioLanguages(audioJobs: any[]): string[] {
  const languages = new Set<string>();
  audioJobs.forEach(job => {
    if (job.completed_languages) {
      job.completed_languages.forEach((lang: string) => languages.add(lang));
    }
  });
  return Array.from(languages);
}

// 🎪 Create Error Response - Our Safety Net
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any,
  requestId?: string
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(requestId && { requestId })
    }
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
