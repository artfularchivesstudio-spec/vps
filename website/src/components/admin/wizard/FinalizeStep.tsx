'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import AudioStatusCard from './AudioStatusCard'

interface FinalizeStepProps {
  onBack: () => void
  postData: any
  clearAutoSave?: () => Promise<void>
  onComplete?: () => void
}

export default function FinalizeStep({ onBack, postData, clearAutoSave, onComplete }: FinalizeStepProps) {
  const { push } = useToast()
  const router = useRouter()
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    push({ emoji: '🎉', title: 'All set!', description: 'Your post flow is complete.', type: 'success' })
  }, [push])

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      // Clear auto-save data
      if (clearAutoSave) {
        await clearAutoSave()
      }

      // Call completion callback
      if (onComplete) {
        onComplete()
      }

      // Show confetti celebration
      push({ 
        emoji: '🎊', 
        title: 'Success!', 
        description: 'Post creation completed successfully! 🎉', 
        type: 'success',
        durationMs: 5000
      })

      // Navigate to posts page after brief delay
      setTimeout(() => {
        router.push('/admin/posts')
      }, 1500)
    } catch (error) {
      console.error('Error completing post creation:', error)
      push({ 
        emoji: '⚠️', 
        title: 'Completion error', 
        description: 'There was an issue finishing up, but your post is saved.', 
        type: 'warning' 
      })
      // Still navigate even if cleanup fails
      setTimeout(() => {
        router.push('/admin/posts')
      }, 2000)
    } finally {
      setIsCompleting(false)
    }
  }

  const jobId = postData?.audioJobId || (typeof window !== 'undefined' ? localStorage.getItem('lastAudioJobId') : null)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Step 5: Finalize</h2>

      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <dl className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Title</dt>
            <dd className="text-gray-900">{postData?.title || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Slug</dt>
            <dd className="text-gray-900">{postData?.slug || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Saved Post ID</dt>
            <dd className="text-gray-900">{postData?.savedPostId || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Audio Job ID</dt>
            <dd className="text-gray-900">{jobId || '—'}</dd>
          </div>
        </dl>

        {/* Quick links */}
        <div className="mt-4 flex items-center gap-2">
          {postData?.slug && (
            <a
              href={`/blog/${postData.slug}`}
              target="_blank"
              className="px-3 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              View Full Blog
            </a>
          )}
          <a
            href={`/admin/posts/${postData?.savedPostId || ''}`}
            className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Admin Preview
          </a>
        </div>

      </div>

      {/* Audio Status Section */}
      {jobId && (
        <AudioStatusCard
          jobId={jobId}
          onRegenerateAudio={() => {
            // TODO: Implement regenerate audio functionality
            push({
              emoji: '🔄',
              title: 'Regenerate Audio',
              description: 'This feature will be implemented soon',
              type: 'info'
            })
          }}
          onAddLanguage={() => {
            // TODO: Implement add language functionality  
            push({
              emoji: '🌍',
              title: 'Add Language',
              description: 'Multi-language support coming soon',
              type: 'info'
            })
          }}
          onRegenerateLanguage={async (language) => {
            try {
              push({
                emoji: '🔄',
                title: 'Regenerating Audio',
                description: `Starting regeneration for ${language.toUpperCase()} audio...`,
                type: 'info'
              })
              
              // Call Supabase Edge Function to regenerate specific language
              const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/audio-regenerate-language`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  jobId: jobId,
                  language: language
                })
              })
              
              if (response.ok) {
                push({
                  emoji: '✅',
                  title: 'Regeneration Started',
                  description: `${language.toUpperCase()} audio regeneration has begun`,
                  type: 'success'
                })
              } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to regenerate audio')
              }
            } catch (error) {
              push({
                emoji: '❌',
                title: 'Regeneration Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                type: 'error'
              })
            }
          }}
        />
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompleting ? 'Finishing up...' : '🎉 Complete & Celebrate!'}
        </button>
      </div>
    </div>
  )
}


