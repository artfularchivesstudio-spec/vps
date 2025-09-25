'use client'

import { PostContent } from '@/components/admin/posts/PostContent'
import { PostHeader } from '@/components/admin/posts/PostHeader'
import { PostSidebar } from '@/components/admin/posts/PostSidebar'
import { useToast } from '@/components/ui/ToastProvider'
import { usePostData } from '@/hooks/usePostData'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PostStatus } from '@/types/blog'
import { MediaAsset } from '@/types/media'
import { useState } from 'react'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params && typeof params.id === 'string' ? params.id : undefined
  const { push } = useToast()

  const {
    post,
    audioAssets,
    audioLoading,
    audioError,
    loading,
    error,
    refreshAudioAssets,
    createAudioJob,
    getAudioJobs
  } = usePostData(postId || '')

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    title: string
    slug: string
    content: string
    status: PostStatus
  }>({
    title: '',
    slug: '',
    content: '',
    status: 'draft'
  })

  const [translationLoading, setTranslationLoading] = useState<Record<string, boolean>>({})
  const [audioGenerationLoading, setAudioGenerationLoading] = useState(false)

  const handleEditFormChange = (field: 'title' | 'slug' | 'content' | 'status', value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const updatePost = async () => {
    if (!post) return

    // Basic validation
    if (!editForm.title.trim()) {
      push({ emoji: '⚠️', title: 'Validation Error', description: 'Title is required', type: 'warning' })
      return
    }
    if (!editForm.slug.trim()) {
      push({ emoji: '⚠️', title: 'Validation Error', description: 'Slug is required', type: 'warning' })
      return
    }
    if (!editForm.content.trim()) {
      push({ emoji: '⚠️', title: 'Validation Error', description: 'Content is required', type: 'warning' })
      return
    }

    try {
      const supabaseClient = createClient()
      const updateDataObj: any = {
        title: editForm.title.trim(),
        slug: editForm.slug.trim(),
        content: editForm.content.trim(),
        status: editForm.status,
        updated_at: new Date().toISOString()
      }

      if (editForm.status === 'published' && post.status !== 'published') {
        updateDataObj.published_at = new Date().toISOString()
      }

      const { error: updateError } = await supabaseClient
        .from('blog_posts')
        .update(updateDataObj)
        .eq('id', post.id)

      if (updateError) {
        console.error('Error updating post:', updateError)
        push({ emoji: '❌', title: 'Update Failed', description: updateError.message, type: 'error' })
        return
      }
      setIsEditing(false)
      push({ emoji: '✅', title: 'Post Updated', description: 'Your changes have been saved', type: 'success' })
    } catch (err) {
      console.error('Error updating post:', err)
      push({ emoji: '❌', title: 'Update Failed', description: 'An unexpected error occurred', type: 'error' })
    }
  }

  const deletePost = async () => {
    if (!post) return

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id)

      if (error) {
        console.error('Error deleting post:', error)
        push({ emoji: '❌', title: 'Delete Failed', description: error.message, type: 'error' })
        return
      }

      push({ emoji: '🗑️', title: 'Post Deleted', description: 'The post has been removed', type: 'info' })
      router.push('/admin/posts')
    } catch (err) {
      console.error('Error deleting post:', err)
      push({ emoji: '❌', title: 'Delete Failed', description: 'An unexpected error occurred', type: 'error' })
    }
  }

  const generateTranslation = async (language: string) => {
    if (!post) return

    // Validate that we have content to translate
    if (!post.content || post.content.trim().length === 0) {
      push({
        emoji: '❌',
        title: 'Translation Failed',
        description: 'Post content is empty or missing. Cannot generate translation.',
        type: 'error'
      })
      return
    }

    setTranslationLoading(prev => ({ ...prev, [language]: true }))

    try {
      console.log(`🌐 🚀 Starting translation for ${language}`)
      console.log(`📝 Content length: ${post.content.length}`)
      console.log(`📖 Title: ${post.title?.substring(0, 50)}...`)
      console.log(`📄 Excerpt: ${post.excerpt?.substring(0, 50)}...`)

      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          target_language: language,
          content: post.content.trim(), // Ensure content is not null/undefined
          title: post.title?.trim() || null,
          excerpt: post.excerpt?.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Translation API error:', errorData)
        throw new Error(errorData.error || `Translation failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log(`✅ Translation completed for ${language}`)
      console.log(`📊 Result: ${result.message || 'Success'}`)

      push({
        emoji: '🌐',
        title: 'Translation Completed',
        description: `Successfully generated ${language.toUpperCase()} translation`,
        type: 'success'
      })
    } catch (error) {
      console.error('Translation error:', error)
      push({
        emoji: '❌',
        title: 'Translation Failed',
        description: `Failed to generate ${language.toUpperCase()} translation: ${String(error)}`,
        type: 'error'
      })
    } finally {
      setTranslationLoading(prev => ({ ...prev, [language]: false }))
    }
  }

  const generateAudio = async (languages: string[]) => {
    if (!post) return

    setAudioGenerationLoading(true)

    try {
      // 🎯 Use the first language as primary while providing all translations
      const primaryLang = languages[0]
      const content = post.content || ''

      if (!content || content.trim().length === 0) {
        throw new Error('No content available for audio generation')
      }

      console.log(`🎵 🎙️ Starting audio generation for languages: ${languages.join(', ')}`)

      // 🌐 Prepare multilingual payload so each language sings in its own tongue
      const multilingualTexts: Record<string, string> = {}
      const multilingualTitles: Record<string, string> = {}
      for (const lang of languages) {
        multilingualTexts[lang] = content
        multilingualTitles[lang] = post.title || ''
      }

      console.log(`🎵 Generating audio for ${primaryLang.toUpperCase()}`)
      console.log(`📝 Text length: ${content.length}`)
      console.log(`📖 Title: ${post.title || 'Untitled'}`)

      const response = await fetch('/api/ai/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.content.trim(),
          languages,
          post_id: post.id,
          title: post.title?.trim() || 'Untitled',
          multilingual_texts: multilingualTexts,
          multilingual_titles: multilingualTitles
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Audio generation API error:', errorData)
        throw new Error(errorData.error || `Audio generation failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log(`✅ Audio generation job created: ${result.jobId}`)

      push({
        emoji: '🎵',
        title: 'Audio Generation Started',
        description: `Job ${result.jobId} created for ${languages.join(', ')}`,
        type: 'success'
      })

      // Refresh the page data to show updated job status
      setIsEditing(false)
      push({ emoji: '✅', title: 'Post Updated', description: 'Your changes have been saved', type: 'success' })
    } catch (error) {
      console.error('Audio generation error:', error)
      push({
        emoji: '❌',
        title: 'Audio Generation Failed',
        description: `Failed to generate audio: ${String(error)}`,
        type: 'error'
      })
    } finally {
      setAudioGenerationLoading(false)
    }
  }

  if (!postId) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg font-semibold">Invalid post ID</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Post not found</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'The post you\'re looking for doesn\'t exist.'}</p>
          <div className="mt-6">
            <Link
              href="/admin/posts"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Posts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PostHeader
          post={post}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={updatePost}
          onCancel={() => setIsEditing(false)}
          onDelete={deletePost}
        />

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => {/* error state managed by hook */}}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PostContent
            post={post}
            isEditing={isEditing}
            editForm={editForm}
            onEditFormChange={handleEditFormChange}
          />
          <PostSidebar
            post={post}
            audioAsset={null}
            audioJobs={[]}
            getAudioAssetForLanguage={(lang) => {
                const asset = audioAssets.find(asset => asset.language === lang);
                return asset ? {
                  id: asset.id,
                  title: asset.title || '',
                  file_url: asset.file_url,
                  file_type: 'audio' as const,
                  mime_type: asset.mime_type || 'audio/mpeg',
                  status: 'ready' as const,
                  created_at: asset.created_at,
                  updated_at: asset.updated_at,
                  file_size_bytes: asset.file_size_bytes,
                  duration_seconds: asset.duration_seconds,
                  related_post_id: asset.post_id
                } as MediaAsset : null;
              }}
            textLanguages={['en']}
            audioLanguages={['en']}
            translationLoading={translationLoading}
            audioGenerationLoading={audioGenerationLoading}
            onGenerateTranslation={generateTranslation}
            onGenerateAudio={generateAudio}
          />
        </div>
      </div>
    </div>
  )
}
