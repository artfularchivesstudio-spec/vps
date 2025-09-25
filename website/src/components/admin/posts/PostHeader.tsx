'use client'

import { Button } from '@/components/ui/Button'
import { BlogPost, PostStatus } from '@/types/blog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// import ReactMarkdown from 'react-markdown'

interface PostHeaderProps {
  post: BlogPost
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

export const PostHeader = ({ post, isEditing, onEdit, onSave, onCancel, onDelete }: PostHeaderProps) => {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      archived: { color: 'bg-red-100 text-red-800', label: 'Archived' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' }
    }
    const config = statusConfig[status as PostStatus] || statusConfig.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getOriginBadge = (origin: string) => {
    const originConfig = {
      manual: { color: 'bg-blue-100 text-blue-800', label: 'Manual' },
      openai: { color: 'bg-purple-100 text-purple-800', label: 'OpenAI' },
      claude: { color: 'bg-orange-100 text-orange-800', label: 'Claude' },
      merged: { color: 'bg-indigo-100 text-indigo-800', label: 'Merged' },
      generated: { color: 'bg-pink-100 text-pink-800', label: 'Generated' },
      uploaded: { color: 'bg-yellow-100 text-yellow-800', label: 'Uploaded' }
    }
    const config = originConfig[origin as keyof typeof originConfig] || originConfig.manual
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/posts"
              className="text-indigo-600 hover:text-indigo-900 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Posts
            </Link>
            <div className="flex items-center space-x-2">
              {getStatusBadge(post.status)}
              {getOriginBadge('manual')}
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Post' : post.title}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <>
              <Button onClick={onEdit}>
                Edit
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onSave}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}