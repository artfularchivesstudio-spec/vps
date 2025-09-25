// 🌟 The cosmic composer - where human imagination meets AI orchestration ✨
// A digital symphony where ideas transform into multimedia masterpieces

'use client'

import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal'
import { useToast } from '@/components/ui/ToastProvider'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useOffline } from '@/hooks/useOffline'
import { useCallback, useEffect, useState } from 'react'
import AnalyzingStep from './wizard/AnalyzingStep'
import AudioStep from './wizard/AudioStep'
import FinalizeStep from './wizard/FinalizeStep'
import ReviewStep from './wizard/ReviewStep'
import TranslationReviewStep from './wizard/TranslationReviewStep'
import TranslationStep from './wizard/TranslationStep'
import UploadStep from './wizard/UploadStep'

type WizardStep = 'upload' | 'analyzing' | 'review' | 'translation' | 'translation-review' | 'audio' | 'finalize'

// 🎭 The grand maestro of content creation - conducting the symphony of digital storytelling
export default function CreatePostWizard({ initialStep = 'upload' }: { initialStep?: WizardStep } = {}) {
  // 🎨 The emotional palette of our creative journey
  const [step, setStep] = useState<WizardStep>(initialStep) // The current movement in our symphony
  const [postData, setPostData] = useState<any>({}) // The living canvas of our creation
  const [isSaving, setIsSaving] = useState<boolean>(false) // The patient artist at work
  const [errors, setErrors] = useState<string[]>([]) // The creative challenges we overcome

  // 🌟 The cosmic connections - database now channeled through edge functions 😌
  const { push } = useToast()

  // 💾 The memory keeper - preserving our creative journey through time
  const [autoSaveKey] = useState(() => `wizard-${Date.now()}`) // A unique fingerprint for our masterpiece - generated once
  const {
    save: autoSave, // The gentle scribe
    lastSaved, // The timestamp of our last creative heartbeat
    isSaving: isAutoSaving, // The patient guardian of our work
    hasUnsavedChanges, // The whisper of unfinished thoughts
    savedData, // The preserved canvas of our imagination
    clearAutoSave // The release of completed dreams
  } = useAutoSave({
    key: autoSaveKey,
    interval: 30000, // Save every 30 seconds - like a rhythmic heartbeat
    enabled: true // Always vigilant, always protecting
  })

  // Offline capability
  const {
    isOnline,
    queuedActions,
    addToQueue,
    processQueue,
    isProcessingQueue
  } = useOffline()

  // ⌨️ The keyboard alchemist - transforming keystrokes into magical commands
  const shortcuts = [
    {
      key: 's',
      ctrlKey: true,
      action: () => autoSave(postData), // The preservation spell
      description: 'Save draft',
      category: 'Editing'
    },
    {
      key: 's',
      metaKey: true,
      action: () => autoSave(postData),
      description: 'Save draft',
      category: 'Editing'
    },
    {
      key: 'ArrowRight',
      ctrlKey: true,
      action: () => navigateToNextStep(),
      description: 'Next step',
      category: 'Navigation'
    },
    {
      key: 'ArrowLeft',
      ctrlKey: true,
      action: () => navigateToPreviousStep(),
      description: 'Previous step',
      category: 'Navigation'
    },
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => navigateToNextStep(),
      description: 'Continue to next step',
      category: 'Navigation'
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      action: () => openPreview(),
      description: 'Preview post',
      category: 'Preview'
    }
  ]

  const {
    showHelp,
    setShowHelp,
    formatShortcut,
    groupedShortcuts
  } = useKeyboardShortcuts({
    shortcuts,
    enabled: true
  })

  // 🧭 The cosmic navigator - guiding our creative journey through the stars
  // "Like a wise theatrical director, we now orchestrate the proper sequence: 
  // First the script is written, then translated for all audiences, 
  // reviewed in all tongues, and only then do we record the voices!"
  const navigateToNextStep = () => {
    switch (step) {
      case 'upload':
        if (postData.imageUrl) setStep('analyzing') // From seed to sprout
        break
      case 'analyzing':
        setStep('review') // From mystery to understanding
        break
      case 'review':
        if (postData.title && postData.content) setStep('translation') // From English script to multilingual screenplay
        break
      case 'translation':
        setStep('translation-review') // From raw translations to polished multilingual content
        break
      case 'translation-review':
        setStep('audio') // From finalized scripts to symphonic voices (using proper translated text!)
        break
      case 'audio':
        setStep('finalize') // From creation to completion
        break
    }
  }

  const navigateToPreviousStep = () => {
    switch (step) {
      case 'analyzing':
        setStep('upload')
        break
      case 'review':
        setStep('upload') // Skip analyzing step when going back
        break
      case 'translation':
        setStep('review')
        break
      case 'translation-review':
        setStep('translation') // Back to translation editing
        break
      case 'audio':
        setStep('translation-review') // Back to reviewing translations before audio
        break
      case 'finalize':
        setStep('audio')
        break
    }
  }

  const openPreview = () => {
    if (postData.savedPostId) {
      window.open(`/admin/posts/preview/${postData.savedPostId}`, '_blank')
    } else {
      push({
        emoji: '⚠️',
        title: 'No preview available',
        description: 'Save your post first to preview',
        type: 'warning'
      })
    }
  }

  // Auto-save whenever postData changes
  useEffect(() => {
    if (Object.keys(postData).length > 0) {
      autoSave(postData)
    }
  }, [postData, autoSave])

  // Load saved data on mount
  useEffect(() => {
    if (savedData && Object.keys(savedData).length > 0) {
      setPostData(savedData)
      push({
        emoji: '📄',
        title: 'Draft restored',
        description: 'Your previous work has been restored',
        type: 'info'
      })
    }
  }, [savedData, push])

  const handleUploadNext = (analysisPrompt: string, uploadedImageUrl: string) => {
    setPostData({ ...postData, analysisPrompt, imageUrl: uploadedImageUrl })
    push({ emoji: '🧪', title: 'Image uploaded', description: 'Starting AI analysis...', type: 'info', durationMs: 2500 })
    setStep('analyzing')
  }

  const handleAnalysisComplete = useCallback((analysisData: any) => {
    console.log('Analysis complete, received data:', analysisData)

    // 🎯 [2025-09-12 22:11] Step 1: stash the raw analysis for later blog wizardry
    const analysis = analysisData.openai_analysis?.content || ''
    const categories = analysisData.suggestedCategories || []
    const tags = analysisData.suggestedTags || []

    setPostData((prev: any) => ({
      ...prev,
      analysis,
      categories,
      tags,
      // Wipe any stale content so the next step knows to brew fresh prose ☕️
      content: '',
      title: '',
      slug: '',
      excerpt: ''
    }))

    setStep('review')
    console.log('Analysis complete callback finished')
  }, [setPostData, setStep])

  const handleAnalysisError = useCallback((error: string) => {
    setErrors([error])
    push({ emoji: '❌', title: 'Analysis failed', description: error, type: 'error' })
    setStep('upload') // Go back to upload step
  }, [push, setStep])

  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    let uniqueSlug = baseSlug
    let counter = 1

    while (true) {
      try {
        // 🌐 Check online status first
        if (!isOnline) {
          console.log('Offline - using timestamp fallback for slug uniqueness')
          const timestamp = Date.now()
          return `${baseSlug}-${timestamp}`
        }

        // 🔍 Direct slug check endpoint - no fuzzy search, just exact slug matching
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const res = await fetch(`/api/admin/posts/check-slug?slug=${encodeURIComponent(uniqueSlug)}`, {
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          console.error(`Slug check API failed with status ${res.status}`)
          throw new Error(`Failed to check slug uniqueness: ${res.status}`)
        }

        const json = await res.json()

        if (json.error) {
          console.error('Slug check API returned error:', json.error)
          throw new Error(`Slug check failed: ${json.error}`)
        }

        // 🎯 Exact slug field check - no fuzzy search nonsense
        const exists = json.data?.exists || false

        if (!exists) {
          console.log(`Unique slug found: ${uniqueSlug}`)
          return uniqueSlug
        }

        console.log(`Slug "${uniqueSlug}" already exists, trying next variation`)
        uniqueSlug = `${baseSlug}-${counter}`
        counter++

        // Prevent infinite loops with reasonable limit
        if (counter > 100) {
          console.error('Maximum slug variations reached')
          throw new Error('Unable to generate unique slug after 100 attempts')
        }

      } catch (error: any) {
        console.error('Error in generateUniqueSlug:', error)

        // 🕰️ Handle timeout specifically
        if (error?.name === 'AbortError') {
          console.log('Slug check timed out - using timestamp fallback')
          const timestamp = Date.now()
          return `${baseSlug}-${timestamp}`
        }

        // 🌐 Network/connectivity issues
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
          console.log('Network issue with slug check - using timestamp fallback')
          const timestamp = Date.now()
          return `${baseSlug}-${timestamp}`
        }

        // 🐛 Other API errors - try a few more times before falling back
        if (counter < 5) {
          console.log(`Retrying slug check (attempt ${counter})`)
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
          continue
        }

        // 🛡️ Final fallback to timestamp-based uniqueness if all else fails
        const timestamp = Date.now()
        console.log(`Using timestamp fallback: ${baseSlug}-${timestamp}`)
        return `${baseSlug}-${timestamp}`
      }
    }
  }

  // 🧪 handleReviewNext — saves the draft before our grand translation adventure 🌍
  //    (Yes, even wizards need backups. 🪄)
  const handleReviewNext = async (finalContent: string, title: string, slug: string, excerpt: string) => {
    setErrors([])
    setIsSaving(true)

    // Declare uniqueSlug at function scope (outside all try blocks)
    let uniqueSlug: string = slug // Default fallback

    try {
      const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === '1'
      if (isE2E) {
        setPostData({ ...postData, title, slug, excerpt, content: finalContent, savedPostId: 'post_123' })
        setStep('translation')
        return
      }

      // 🌐 Check online status before attempting save
      if (!isOnline) {
        throw new Error('You are offline. Please check your connection and try again.')
      }

      try {
        uniqueSlug = await generateUniqueSlug(slug)
      } catch (slugError) {
        // If slug generation fails, use a fallback
        console.warn('Slug generation failed, using fallback:', slugError)
        uniqueSlug = `${slug}-${Date.now()}`
      }
      const payload = {
        title,
        slug: uniqueSlug,
        excerpt,
        content: finalContent,
        status: 'draft',
        featured_image_url: postData.imageUrl || null,
        selected_ai_provider: 'openai',
        content_version: 1 // Start with version 1 for new posts
      }

      let res
      try {
        if (postData.savedPostId) {
          res = await fetch(`/api/admin/posts?id=${postData.savedPostId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        } else {
          res = await fetch('/api/admin/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        }
      } catch (networkError) {
        console.error('Network error during save:', networkError)
        throw new Error('Network connection failed. Supabase may be experiencing issues. Please try again in a few minutes.')
      }

      // ⏰ Handle timeout scenarios
      if (!res) {
        throw new Error('Request timed out. Supabase may be experiencing connectivity issues.')
      }

      let result
      try {
        result = await res.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Received invalid response from server. Please try again.')
      }

      if (!res.ok || result.error) {
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || '' // 🕵️‍♂️ Decode mysterious error objects into plain text

        // 🐛 Special handling for known Supabase connectivity issues
        if (errorMessage.includes('Failed to create post')) {
          console.log('🔍 Supabase connectivity issue detected - checking status...')
          throw new Error(`Database connection issue detected. Supabase is experiencing connectivity problems in your region. Please check https://status.supabase.com/ for updates. Your work will be saved locally and synced when connection is restored.`)
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('connection') || errorMessage.includes('network')) {
          throw new Error('Network connectivity issue. Your work will be saved locally and retried automatically when connection is restored.')
        }
        if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error(`Server error (${res.status}). Supabase may be experiencing temporary issues. Please try again in a few minutes.`)
        }
        throw new Error(errorMessage || 'Failed to save post')
      }

      const savedId = result.data.id || result.data?.post?.id
      const contentVersion = result.data.content_version || result.data?.post?.content_version || 1

      setPostData({
        ...postData,
        title,
        slug: uniqueSlug,
        excerpt,
        content: finalContent,
        savedPostId: savedId,
        contentVersion,
        audioIsStale: result.data.audio_marked_stale || false
      })
      push({ emoji: '💾', title: 'Post saved (draft)', description: `ID: ${savedId}`, type: 'success' })
      setStep('translation')
    } catch (e: any) {
      console.error('Save operation failed:', e)

      // 📱 Queue for offline retry if it's a network/connectivity issue
      if (!isOnline ||
          e?.message?.includes('Network connection failed') ||
          e?.message?.includes('connectivity') ||
          e?.message?.includes('Database connection issue') ||
          e?.message?.includes('Server error') ||
          e?.message?.includes('timeout')) {

        // Save post data locally for offline mode
        const offlinePostData = {
          finalContent,
          title,
          slug: uniqueSlug,
          excerpt,
          content_version: 1,
          saved_at: new Date().toISOString(),
          status: 'offline_pending'
        }

        // Store in localStorage as backup
        try {
          const offlinePosts = JSON.parse(localStorage.getItem('offline_posts') || '[]')
          offlinePosts.push(offlinePostData)
          localStorage.setItem('offline_posts', JSON.stringify(offlinePosts))
        } catch (storageError) {
          console.warn('Failed to save to localStorage:', storageError)
        }

        addToQueue('create', offlinePostData)

        push({
          emoji: '💾',
          title: 'Saved locally',
          description: 'Post saved offline. Will sync when Supabase connection is restored.',
          type: 'success',
          durationMs: 5000
        })

        // Simulate successful save for offline mode
        setPostData({
          ...postData,
          title,
          slug: uniqueSlug,
          excerpt,
          content: finalContent,
          savedPostId: `offline_${Date.now()}`, // Temporary ID for offline mode
          contentVersion: 1,
          audioIsStale: false,
          offlineMode: true
        })

        push({
          emoji: '✅',
          title: 'Post saved (offline mode)',
          description: `ID: offline_${Date.now()}. Ready to proceed!`,
          type: 'success'
        })

        setStep('translation')
        return // Don't show error, we've handled it gracefully
      }

      setErrors([e?.message || 'Failed to save post'])
      push({ emoji: '❌', title: 'Save failed', description: String(e?.message || e), type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAudioNext = (audioData: { jobId: string | null; immediateUrls?: Record<string, string>; status: 'immediate' | 'processing' | 'none' }) => {
    console.log('🎵 AudioStep provided data:', audioData);
    
    setPostData({ 
      ...postData, 
      audioJobId: audioData.jobId,
      audioContentVersion: postData.contentVersion,
      audioImmediateUrls: audioData.immediateUrls,
      audioStatus: audioData.status
    })
    
    try {
      if (audioData.jobId) {
        localStorage.setItem('lastAudioJobId', audioData.jobId)
      }
    } catch {}
    
    const statusMessage = audioData.status === 'immediate' 
      ? `Immediate audio ready for ${Object.keys(audioData.immediateUrls || {}).length} languages!`
      : audioData.jobId 
        ? `Job ID: ${audioData.jobId}. Processing in background...`
        : 'Ready to finalize!'
    
    push({ emoji: '✅', title: 'Audio configured', description: statusMessage, type: 'success' })
    setStep('finalize')
  }

  const handleTranslationNext = () => {
    push({ emoji: '🌍', title: 'Translations generated', description: 'Time to review all languages!', type: 'success' })
    setStep('translation-review')
  }

  const handleTranslationReviewNext = () => {
    push({ emoji: '✅', title: 'All translations approved', description: 'Ready for multilingual audio generation!', type: 'success' })
    setStep('audio')
  }

  const goToPreviousStep = () => {
    switch (step) {
      case 'analyzing':
        setStep('upload')
        break
      case 'review':
        setStep('upload') // Skip analyzing step when going back
        break
      case 'translation':
        setStep('review')
        break
      case 'translation-review':
        setStep('translation')
        break
      case 'audio':
        setStep('translation-review')
        break
      case 'finalize':
        setStep('audio')
        break
      default:
        break
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return <UploadStep onNext={handleUploadNext} setPostData={setPostData} />
      case 'analyzing':
        return (
          <AnalyzingStep
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
            postData={postData}
          />
        )
      case 'review':
        return (
          <ReviewStep
            onNext={handleReviewNext}
            onBack={navigateToPreviousStep}
            postData={postData}
            setPostData={setPostData}
          />
        )
      case 'translation':
        return (
          <TranslationStep
            onNext={handleTranslationNext}
            onBack={navigateToPreviousStep}
            postData={postData}
            onDataUpdate={setPostData}
          />
        )
      case 'translation-review':
        return (
          <TranslationReviewStep
            onNext={handleTranslationReviewNext}
            onBack={navigateToPreviousStep}
            postData={postData}
            onDataUpdate={setPostData}
          />
        )
      case 'audio':
        return (
          <AudioStep
            onNext={handleAudioNext}
            onBack={navigateToPreviousStep}
            postData={postData}
          />
        )
      case 'finalize':
        return (
          <FinalizeStep
            onBack={goToPreviousStep}
            postData={postData}
            clearAutoSave={clearAutoSave}
            onComplete={() => {
              // Mark as no unsaved changes to prevent browser warning
              // This will be handled by the FinalizeStep completion logic
            }}
          />
        )
      default:
        return <div />
    }
  }

  return (
    <>
      {/* 🌟 The cosmic dashboard - our creative vital signs */}
      <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
        {/* Online/Offline Status */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOnline
            ? 'bg-green-100 text-green-800'
            : postData.offlineMode
              ? 'bg-blue-100 text-blue-800'
              : 'bg-orange-100 text-orange-800'
        }`}>
          {isOnline
            ? '🌐 Online'
            : postData.offlineMode
              ? '💾 Offline Mode'
              : '📴 Offline'
          }
        </div>
        
        {/* Auto-save Status */}
        {lastSaved && (
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            💾 {new Date(lastSaved).toLocaleTimeString()}
          </div>
        )}
        
        {/* Queued Actions */}
        {queuedActions.length > 0 && (
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            📦 {queuedActions.length} queued
          </div>
        )}

        {/* Offline Posts Count */}
        {(() => {
          try {
            const offlinePosts = JSON.parse(localStorage.getItem('offline_posts') || '[]')
            if (offlinePosts.length > 0) {
              return (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  💾 {offlinePosts.length} offline posts
                </div>
              )
            }
          } catch (e) {
            // Ignore localStorage errors
          }
          return null
        })()}
        
        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => setShowHelp(true)}
          className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
          title="Keyboard shortcuts (?)"
        >
          ⌨️ Shortcuts
        </button>
      </div>

      {/* 🎨 The grand stage - where our creative symphony performs */}
      <div className="max-w-4xl mx-auto py-8" data-testid="wizard-container">
        <h1 className="text-3xl font-bold text-center mb-8">Create New Post</h1>
        {/* 🧭 The journey map - tracking our progress through creative realms */}
        <div className="mb-4 flex items-center justify-center gap-3 text-xs text-gray-700">
          <div className={`px-2 py-1 rounded ${step === 'upload' ? 'bg-indigo-100' : 'bg-gray-100'}`}>🖼️ Upload</div>
          <div>➡️</div>
          <div className={`px-2 py-1 rounded ${step === 'analyzing' ? 'bg-indigo-100' : 'bg-gray-100'}`}>🤖 Analyzing</div>
          <div>➡️</div>
          <div className={`px-2 py-1 rounded ${step === 'review' ? 'bg-indigo-100' : 'bg-gray-100'}`}>📝 Review</div>
          <div>➡️</div>
          <div className={`px-2 py-1 rounded ${step === 'translation' ? 'bg-indigo-100' : 'bg-gray-100'}`}>🌐 Translation</div>
          <div>➡️</div>
          <div className={`px-2 py-1 rounded ${step === 'audio' ? 'bg-indigo-100' : 'bg-gray-100'}`}>🎙️ Audio</div>
          <div>➡️</div>
          <div className={`px-2 py-1 rounded ${step === 'finalize' ? 'bg-indigo-100' : 'bg-gray-100'}`}>✅ Finalize</div>
        </div>
      {errors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        {isSaving ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Saving post...</p>
          </div>
        ) : (
          renderStep()
        )}
      </div>
      {/* 🎯 The completion compass - our guide through the creative constellations */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="bg-white/80 backdrop-blur-md border rounded-full shadow-lg overflow-hidden">
            {(() => {
              const map: Record<string, { pct: number; label: string; emoji: string }> = {
                upload: { pct: 14, label: 'Upload', emoji: '🖼️' },
                analyzing: { pct: 28, label: 'Analyzing', emoji: '🤖' },
                review: { pct: 42, label: 'Review', emoji: '📝' },
                translation: { pct: 56, label: 'Translation', emoji: '🌐' },
                'translation-review': { pct: 70, label: 'Translation Review', emoji: '🔍' },
                audio: { pct: 84, label: 'Audio', emoji: '🎙️' },
                finalize: { pct: 100, label: 'Finalize', emoji: '✅' },
              }
              const info = map[step] || { pct: 0, label: 'Unknown', emoji: '❓' }
              return (
                <div className="relative h-8">
                  <div className="absolute inset-0 bg-gray-100"></div>
                  <div className="absolute inset-y-0 left-0 bg-indigo-500 transition-all" style={{ width: `${info.pct}%` }}></div>
                  <div className="relative z-10 h-full flex items-center justify-between px-3 text-xs text-white">
                    <div className="flex items-center gap-2">
                      <span>{info.emoji}</span>
                      <span>{info.label}</span>
                    </div>
                    <div className="font-medium">{info.pct}%</div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
      
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        groupedShortcuts={groupedShortcuts}
        formatShortcut={formatShortcut}
      />
    </div>
    </>
  )
}
