'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MagicalBlogPost from '@/components/blog/MagicalBlogPost'
import { BlogPost } from '@/types/blog'

const supabase = createClient()

interface PostPreviewPageProps {
  params: {
    id: string
  }
}

export default function PostPreviewPage({ params }: PostPreviewPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!params.id) return

      const { data, error } = await supabase
        .from('posts')
        .select('*, author:posts_author_id_fkey(*), categories:posts_categories(*), tags:posts_tags(*)')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching post for preview:', error)
        setError(error.message)
      } else {
        // Here we need to transform the data to match the BlogPost type expected by MagicalBlogPost
        const transformedPost: BlogPost = {
          ...data,
          featured_image_url: data.featured_image_url,
          author: data.author,
          categories: data.categories.map((c: any) => c.categories),
          tags: data.tags.map((t: any) => t.tags),
        };
        setPost(transformedPost)
      }
    }

    fetchPost()
  }, [params.id])

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>
  }

  if (!post) {
    return <div className="text-center p-8">Loading post preview...</div>
  }

  return (
    <div>
      <MagicalBlogPost post={post} isDraft />
    </div>
  )
}
