'use client'

import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { BlogPost } from '@/types/blog'
import Image from 'next/image'
import { ChangeEvent } from 'react'

interface PostContentProps {
  post: BlogPost
  isEditing: boolean
  editForm: {
    title: string
    slug: string
    content: string
    status: string
  }
  onEditFormChange: (field: 'title' | 'slug' | 'content' | 'status', value: string) => void
}

export const PostContent = ({ post, isEditing, editForm, onEditFormChange }: PostContentProps) => {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="relative h-64">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              width={800}
              height={400}
              className="object-contain w-full h-full"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={editForm.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onEditFormChange('title', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  value={editForm.slug}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onEditFormChange('slug', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onChange={(e: ChangeEvent<HTMLSelectElement>) => onEditFormChange('status', e.target.value)}>
                  <SelectTrigger>
                    <SelectValue>Select status</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={editForm.content}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onEditFormChange('content', e.target.value)}
                  rows={20}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
              {post.excerpt && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Excerpt</h4>
                  <p className="text-lg text-gray-600 italic">{post.excerpt}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}