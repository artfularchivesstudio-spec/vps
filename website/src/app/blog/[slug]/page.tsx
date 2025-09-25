import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPosts } from '@/lib/api/supabase'
import MultilingualBlogPost from '@/components/blog/MultilingualBlogPost'
import { BlogPost } from '@/types/blog'

// Define types - Using our enhanced multilingual blog post interface
interface PostPageProps {
  params: {
    slug: string
  }
}

// Statically generate routes for all posts
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map(post => ({
    slug: post.slug,
  }))
}

// Define metadata for the page
export async function generateMetadata({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug)
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }
  return {
    title: post.title,
    description: post.excerpt,
  }
}

// The main page component
export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="bg-gray-100">
      <MultilingualBlogPost post={post} />
    </div>
  )
} 