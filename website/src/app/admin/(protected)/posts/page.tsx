import Link from 'next/link'
import { PlusCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BlogPost } from '@/types/blog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import PostsClient from './posts-client'
import { BulkActions } from '@/components/admin/posts/BulkActions'

// This is the main page for managing blog posts in the admin dashboard.
// It displays a list of all posts and allows for searching, filtering,
// and performing bulk actions.

export default async function PostsPage() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:posts_author_id_fkey(*),
      categories:posts_categories(
        category:categories(id, name, slug)
      ),
      tags:posts_tags(
        tag:tags(id, name, slug)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return <div>Error loading posts</div>
  }
  
  const posts = data.map((post: any) => ({
    ...post,
    author: post.author,
    categories: post.categories.map((c: any) => c.category).filter(Boolean),
    tags: post.tags.map((t: any) => t.tag).filter(Boolean),
  })) as BlogPost[]

  // Define state variables for client component
  const searchTerm = ''
  const selectedPosts: string[] = []
  const setSearchTerm = (_: string) => {}
  const setSelectedPosts = () => {}

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-gray-500">Manage your creative works.</p>
        </div>
        <Link href="/admin/posts/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>
            Here you can see and manage all of your posts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search posts..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <BulkActions 
              selectedPosts={selectedPosts}
              onSelectionChange={setSelectedPosts}
              onBulkActionComplete={() => {
                // Here you would refetch the posts data
              }} 
            />
          </div>
            <PostsClient initialPosts={posts} />
        </CardContent>
      </Card>
    </div>
  )
}
