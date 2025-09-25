import { NextRequest } from 'next/server'
import { withExternalAPIAuth, handleOPTIONS, withCORS, parsePagination, createPaginationMeta, validateRequestBody, ExternalAPIRequest } from '@/lib/external-api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/external-api/auth'
import { createClientForAPI } from '@/lib/supabase/server'

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleOPTIONS()
}

// GET /api/external/posts - List all posts
async function handleGetPosts(req: ExternalAPIRequest) {
  const supabase = createClientForAPI()
  const { page, limit } = parsePagination(req)
  
  // Parse query parameters
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const category = url.searchParams.get('category')
  const tag = url.searchParams.get('tag')
  const search = url.searchParams.get('search')
  const author = url.searchParams.get('author')
  const orderBy = url.searchParams.get('order_by') || 'created_at'
  const orderDirection = url.searchParams.get('order_direction') || 'desc'
  
  try {
    // Build query with filters
    let query = supabase
      .from('blog_posts')
      .select(`
        id, title, slug, excerpt, content, featured_image_url,
        status, template_type, reading_time, revision_number,
        created_at, updated_at, published_at, author_id,
        title_translations, content_translations, excerpt_translations,
        audio_assets_by_language, seo_metadata
      `, { count: 'exact' })
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }
    
    if (author) {
      query = query.eq('created_by', author)
    }
    
    // Apply ordering and pagination
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })
    query = query.range((page - 1) * limit, page * limit - 1)
    
    const { data: posts, error, count } = await query
    
    if (error) {
      console.error('Error fetching posts:', error)
      return createErrorResponse('Failed to fetch posts', 500)
    }
    
    // Fetch categories and tags for each post
    const postsWithRelations = await Promise.all(
      (posts || []).map(async (post) => {
        // Fetch categories
        const { data: categories } = await supabase
          .from('post_categories')
          .select(`
            categories!inner(id, name, slug)
          `)
          .eq('blog_post_id', post.id)
        
        // Fetch tags
        const { data: tags } = await supabase
          .from('content_tags')
          .select(`
            tags!inner(id, name, slug)
          `)
          .eq('content_id', post.id)
          .eq('content_type', 'blog_post')
        
        return {
          ...post,
          categories: categories?.map((c: any) => c.categories) || [],
          tags: tags?.map((t: any) => t.tags) || [],
        }
      })
    )
    
    return createSuccessResponse({
      posts: postsWithRelations,
      pagination: createPaginationMeta(page, limit, count || 0)
    }, {
      rateLimit: {
        limit: req.auth.apiKey?.rate_limit || 0,
        remaining: req.auth.rateLimitRemaining || 0,
        reset: Date.now() + 3600000
      }
    })
  } catch (error) {
    console.error('Error in handleGetPosts:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST /api/external/posts - Create new post
async function handleCreatePost(req: ExternalAPIRequest) {
  const supabase = createClientForAPI()
  
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.content) {
      return createErrorResponse('Missing required fields: title and content', 400)
    }
    
    // Prepare post data
    const postData = {
      title: body.title,
      slug: body.slug || generateSlug(body.title),
      content: body.content,
      excerpt: body.excerpt || generateExcerpt(body.content),
      featured_image_url: body.featured_image_url || null,
      status: body.status || 'draft',
      author_id: req.auth.userId,
      template_type: body.template_type || null,
      seo_metadata: body.seo_metadata || {},
      title_translations: body.title_translations || {},
      content_translations: body.content_translations || {},
      excerpt_translations: body.excerpt_translations || {},
      audio_assets_by_language: body.audio_assets_by_language || {},
    }
    
    // Set published_at if publishing immediately
    if (body.publish_immediately && postData.status === 'published') {
      ;(postData as any).published_at = new Date().toISOString()
    }
    
    // Insert post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating post:', error)
      return createErrorResponse('Failed to create post', 500)
    }
    
    // Handle categories if provided
    if (body.categories && body.categories.length > 0) {
      await handleCategories(supabase, post.id, body.categories)
    }
    
    // Handle tags if provided
    if (body.tags && body.tags.length > 0) {
      await handleTags(supabase, post.id, body.tags)
    }
    
    // Fetch the complete post with relations
    const completePost = await fetchPostWithRelations(supabase, post.id)
    
    return createSuccessResponse(completePost, {
      rateLimit: {
        limit: req.auth.apiKey?.rate_limit || 0,
        remaining: req.auth.rateLimitRemaining || 0,
        reset: Date.now() + 3600000
      }
    })
  } catch (error) {
    console.error('Error in handleCreatePost:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Helper functions
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

function generateExcerpt(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, '')
  return plainText.length > 160 
    ? plainText.substring(0, 157) + '...'
    : plainText
}

// Handle categories for a post
async function handleCategories(supabase: any, postId: string, categoryNames: string[]) {
  for (const categoryName of categoryNames) {
    // Find or create category
    let { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single()
    
    if (!category) {
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({
          name: categoryName,
          slug: generateSlug(categoryName)
        })
        .select('id')
        .single()
      category = newCategory
    }
    
    if (category) {
      // Link category to post
      await supabase
        .from('post_categories')
        .upsert({
          blog_post_id: postId,
          category_id: category.id
        })
    }
  }
}

// Handle tags for a post
async function handleTags(supabase: any, postId: string, tagNames: string[]) {
  for (const tagName of tagNames) {
    // Find or create tag
    let { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single()
    
    if (!tag) {
      const { data: newTag } = await supabase
        .from('tags')
        .insert({
          name: tagName,
          slug: generateSlug(tagName)
        })
        .select('id')
        .single()
      tag = newTag
    }
    
    if (tag) {
      // Link tag to post
      await supabase
        .from('content_tags')
        .upsert({
          content_id: postId,
          content_type: 'blog_post',
          tag_id: tag.id
        })
    }
  }
}

// Fetch a single post with its relations
async function fetchPostWithRelations(supabase: any, postId: string) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select(`
      id, title, slug, excerpt, content, featured_image_url,
      status, template_type, reading_time, revision_number,
      created_at, updated_at, published_at, author_id,
      title_translations, content_translations, excerpt_translations,
      audio_assets_by_language, seo_metadata
    `)
    .eq('id', postId)
    .single()
  
  if (!post) return null
  
  // Fetch categories
  const { data: categories } = await supabase
    .from('post_categories')
    .select(`
      categories!inner(id, name, slug)
    `)
    .eq('blog_post_id', post.id)
  
  // Fetch tags
  const { data: tags } = await supabase
    .from('content_tags')
    .select(`
      tags!inner(id, name, slug)
    `)
    .eq('content_id', post.id)
    .eq('content_type', 'blog_post')
  
  return {
    ...post,
    categories: categories?.map((c: any) => c.categories) || [],
    tags: tags?.map((t: any) => t.tags) || [],
  }
}

export async function GET(request: NextRequest) {
  return withCORS(await withExternalAPIAuth(request, handleGetPosts, ['posts:read']))
}

export async function POST(request: NextRequest) {
  return withCORS(await withExternalAPIAuth(request, handleCreatePost, ['posts:write']))
}