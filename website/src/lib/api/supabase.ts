/**
 * 🎭 The Supabase Multilingual API Client - A Data Theatre Performance
 * 
 * "In this digital opera house where database queries dance like ballet dancers,
 * each function gracefully fetches multilingual content from our Supabase stage.
 * Every blog post emerges not as a single voice, but as a multilingual choir
 * ready to sing its story in English, Spanish, and Hindi harmonies."
 *
 * - The Database Virtuoso
 */

import { createClient } from '@/lib/supabase/client'
import { PostgrestError } from '@supabase/supabase-js'
import { BlogPost } from '@/types/blog'
import { Category } from '@/types/category'
import { Tag } from '@/types/tag'

const supabase = createClient()

// 🎭 The Blog Post - Our Multilingual Performer
export interface PostgrestResponse<T> {
  data: T[] | null
  error: PostgrestError | null
  count: number | null
}

/**
 * Fetches a single blog post by its slug, including author, categories, and tags.
 * This is the primary function for retrieving a complete post for display.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:posts_author_id_fkey!inner(*),
      categories:posts_categories!inner(
        category:categories!inner(id, name, slug, description)
      ),
      tags:posts_tags!inner(
        tag:tags!inner(id, name, slug)
      )
    `
    )
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }

  if (!data) {
    return null
  }
  
  const featured_image_url = data.featured_image_url
    ? supabase.storage.from('images').getPublicUrl(data.featured_image_url).data.publicUrl
    : null;

  // Manually construct the BlogPost object with relations
  const post: BlogPost = {
    id: data.id,
    slug: data.slug,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt || '',
    featured_image_url,
    published_at: data.published_at || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    status: data.status || 'draft',
    author_id: data.author_id,
    template_type: data.template_type || null,
    reading_time: data.reading_time || null,
    revision_number: data.revision_number || 1,
    title_translations: data.title_translations || {},
    content_translations: data.content_translations || {},
    excerpt_translations: data.excerpt_translations || {},
    seo_metadata: data.seo_metadata || { title: data.title, description: data.excerpt || '' },
    author: data.author || undefined, // Convert null to undefined for type compatibility
    categories: data.categories?.map((c: any) => c.category).filter(Boolean) || [],
    tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
    audio_assets_by_language: data.audio_assets_by_language || {},
  }

  return post
}

// Fetches all blog posts with their relations
export async function getAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:posts_author_id_fkey!inner(*),
      categories:posts_categories!inner(
        category:categories!inner(id, name, slug, description)
      ),
      tags:posts_tags!inner(
        tag:tags!inner(id, name, slug)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all posts:', error)
    return []
  }

  return data.map((post: any) => {
    const featured_image_url = post.featured_image_url
      ? supabase.storage.from('images').getPublicUrl(post.featured_image_url).data.publicUrl
      : null;
      
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      featured_image_url,
      published_at: post.published_at || null,
      created_at: post.created_at,
      updated_at: post.updated_at,
      status: post.status || 'draft',
      author_id: post.author_id,
      template_type: post.template_type || null,
      reading_time: post.reading_time || null,
      revision_number: post.revision_number || 1,
      title_translations: post.title_translations || {},
      content_translations: post.content_translations || {},
      excerpt_translations: post.excerpt_translations || {},
      seo_metadata: post.seo_metadata || { title: post.title, description: post.excerpt || '' },
      author: post.author || undefined, // Convert null to undefined for type compatibility
      categories: post.categories?.map((c: any) => c.category).filter(Boolean) || [],
      tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      audio_assets_by_language: post.audio_assets_by_language || {},
    }
  })
}