'use client'

import RichMediaEditor from '@/components/admin/RichMediaEditor'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface ReviewStepProps {
  onNext: (finalContent: string, title: string, slug: string, excerpt: string) => void
  onBack: () => void
  postData: any
  setPostData: (data: any) => void
}

// 🧾 Function-level comment: the backstage manager—shows AI's analysis, brews blog prose, and herds editors to the spotlight 🎭☕️
export default function ReviewStep({ onNext, onBack, postData, setPostData }: ReviewStepProps) {
  const [useRichEditor, setUseRichEditor] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleNext = () => {
    setErrors([])
    
    if (!postData.title?.trim()) {
      setErrors(['Post title is required'])
      return
    }

    if (!postData.content?.trim()) {
      setErrors(['Post content is required'])
      return
    }

    onNext(
      postData.content,
      postData.title,
      postData.slug || generateSlug(postData.title),
      postData.excerpt || ''
    )
  }

  useEffect(() => {
    // 🚀 [2025-09-12 22:11] Step 2: if analysis exists but prose is empty, call the content kitchen
    const generateContent = async () => {
      if (!postData.analysis || postData.content) return
      setIsGenerating(true)
      try {
        const res = await fetch('/api/generate-blog-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis: postData.analysis })
        })
        const data = await res.json()
        if (res.ok) {
          setPostData({
            ...postData,
            content: data.blogContent || '',
            title: data.suggestedTitle || '',
            slug: data.suggestedSlug || '',
            excerpt: data.excerpt || ''
          })
        } else {
          console.error('Blog generation failed:', data.error)
        }
      } catch (err) {
        console.error('Blog generation error:', err)
      } finally {
        setIsGenerating(false)
      }
    }

    generateContent()
  }, [postData, setPostData])



  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Step 2: Review & Edit Content</h2>

      {postData.analysis && (
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis</h3>
          <p className="whitespace-pre-wrap text-gray-700 text-sm">{postData.analysis}</p>
        </div>
      )}

      {isGenerating && (
        <div className="text-sm text-gray-600">⏳ Generating blog content… hold tight!</div>
      )}

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-800">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Post Details */}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Post Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 h-5">
              Title
            </label>
              <input
                type="text"
                value={postData.title || ''}
                onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                className="w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter post title..."
                disabled={isGenerating}
              />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 h-5">
              Slug
            </label>
              <input
                type="text"
                value={postData.slug || generateSlug(postData.title || '')}
                onChange={(e) => setPostData({ ...postData, slug: e.target.value })}
                className="w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="post-slug-url"
                disabled={isGenerating}
              />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 h-5">
              Excerpt
            </label>
              <textarea
                value={postData.excerpt || ''}
                onChange={(e) => setPostData({ ...postData, excerpt: e.target.value })}
                rows={3}
                className="w-full min-h-[5rem] border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                placeholder="A short summary of the post..."
                disabled={isGenerating}
              />
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Content Editor</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rich-editor-toggle"
              checked={useRichEditor}
              onChange={(e) => setUseRichEditor(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="rich-editor-toggle" className="text-sm text-gray-600">
              Use Rich Media Editor
            </label>
          </div>
        </div>
        
        {useRichEditor ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create rich, multimedia content with text, images, videos, quotes, and more.
            </p>
            <RichMediaEditor
              initialContent={postData.richMediaBlocks || []}
              onChange={(blocks) => setPostData({ ...postData, richMediaBlocks: blocks })}
              className="min-h-[400px]"
            />
          </div>
        ) : (
            <div>
              <textarea
                className="w-full h-96 border border-gray-300 rounded-md p-3 text-sm resize-none"
                value={postData.content || ''}
                onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                placeholder="AI-generated content will appear here. You can edit it directly."
                disabled={isGenerating}
              />
            </div>
          )}
      </div>

      {/* Image Preview */}
      {postData.imageUrl && (
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Featured Image</h3>
          <div className="relative w-full h-64">
            {/* Handle sandbox URLs and other non-standard protocols */}
            {postData.imageUrl.startsWith('sandbox:') || postData.imageUrl.startsWith('blob:') || postData.imageUrl.startsWith('data:') ? (
              <Image
                src={postData.imageUrl}
                alt="Featured artwork"
                fill
                className="object-contain rounded-lg"
                unoptimized
              />
            ) : (
              <Image
                src={postData.imageUrl}
                alt="Featured artwork"
                fill
                className="object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Continue to Translation
        </button>
      </div>
    </div>
  )
}
