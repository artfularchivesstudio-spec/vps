'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { BlogPost } from '@/types/blog'
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { BulkActions } from '@/components/admin/posts/BulkActions'

interface PostsClientProps {
  initialPosts: BlogPost[]
}

export default function PostsClient({ initialPosts }: PostsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  
  const filteredPosts = initialPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPosts(filteredPosts.map(p => p.id as string))
    } else {
      setSelectedPosts([])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedPosts.length > 0 && (
          <BulkActions 
            selectedPosts={selectedPosts}
            onSelectionChange={setSelectedPosts}
            onBulkActionComplete={() => window.location.reload()}
          />
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedPosts.length > 0 && selectedPosts.length === filteredPosts.length}
                />
              </th>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Author</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Published</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center">No posts found</td>
              </tr>
            ) : (
              filteredPosts.map(post => (
                <tr key={post.id} className="border-b">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id as string)}
                      onChange={() => handleSelectPost(post.id as string)}
                    />
                  </td>
                  <td className="p-4 font-medium">{post.title}</td>
                  <td className="p-4 text-gray-500">{post.author?.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/posts/${post.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}