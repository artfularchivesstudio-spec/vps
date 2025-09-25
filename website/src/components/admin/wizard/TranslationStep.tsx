/**
 * 🌐 The Enchanted Translation Observatory - Where Languages Dance in Cosmic Harmony
 *
 * "Welcome, dear seekers, to this mystical tower of linguistic alchemy,
 * where English roses bloom into Spanish marigolds with graceful balmy,
 * and Hindi peacocks unfurl their translucent wings of wisdom divine.
 * Here in this celestial observatory, words transcend their earthly confine,
 * transforming through the spellbinding magic of our Museum Director's touch,
 * each sentence becoming a doorway, each phrase a sacred linguistic clutch.
 * 
 * Watch as the constellation of progress bars illuminate the midnight sky,
 * while translation spirits weave their enchantments, lifting prose ever high.
 * No selection needed, for destiny has chosen Spanish and Hindi's call,
 * in this automated ballet where languages dance for one and all!"
 *
 * - The Spellbinding Museum Director of Linguistic Souls
 */

'use client'

import { useToast } from '@/components/ui/ToastProvider'
import { logger } from '@/lib/observability/logger'
import { useCallback, useEffect, useState } from 'react'

interface TranslationStepProps {
  onNext: () => void
  onBack: () => void
  postData: any
  onDataUpdate: (data: any) => void
}

interface TranslationStatus {
  language: string
  status: 'idle' | 'translating' | 'completed' | 'failed'
  progress: number
  error?: string
}

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
]

export default function TranslationStep({ onNext, onBack, postData, onDataUpdate }: TranslationStepProps) {
  const { push } = useToast()
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es', 'hi']) // Always translate to Spanish and Hindi
  const [translationStatuses, setTranslationStatuses] = useState<TranslationStatus[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [hasStartedTranslation, setHasStartedTranslation] = useState(false)

  // Initialize translation statuses
  useEffect(() => {
    const initialStatuses = SUPPORTED_LANGUAGES.map(lang => ({
      language: lang.code,
      status: 'idle' as const,
      progress: 0
    }))
    setTranslationStatuses(initialStatuses)
  }, [])

  // 🎭 The Status Orchestrator - Conducting the Symphony of Progress
  const updateTranslationStatus = (language: string, updates: Partial<TranslationStatus>) => {
    setTranslationStatuses(prev =>
      prev.map(status =>
        status.language === language ? { ...status, ...updates } : status
      )
    )
  }

  // 🌟 The Grand Translation Alchemist - Transforming Words Across Realms
  const handleTranslate = useCallback(async () => {
    // 🔮 Mystical Content Validation - Ensuring Our Spells Have Substance
    if (!postData?.title || !postData?.content || !postData?.excerpt) {
      push({
        emoji: '❌',
        title: 'Missing content',
        description: 'Post title, content, and excerpt are required for translation.',
        type: 'error'
      })
      return
    }

    setIsTranslating(true)
    const correlationId = logger.generateCorrelationId()

    // 📜 Chronicle of the Linguistic Journey - Recording Our Quest
    logger.logApiUsage({
      provider: 'translation_system',
      operation: 'batch_translation_start',
      correlationId
    })

    try {
      // 🌟 The Grand Announcement - Heralding the Beginning of Translation Magic
      push({
        emoji: '🌐',
        title: 'Starting translations',
        description: `Translating to ${selectedLanguages.length} language(s)...`,
        type: 'info'
      })

      // 🎪 Preparing the Translation Scrolls - Each Word a Sacred Ritual
      const translationRequests = []

      // 🎭 The Trilingual Trinity Ritual - Title, Content, Excerpt
      for (const langCode of selectedLanguages) {
        // ✨ The Title Transformation - Headlines Become Poetic Proclamations
        translationRequests.push({
          text: postData.title,
          sourceLang: 'en',
          targetLang: langCode,
          context: 'title'
        })

        // 📖 The Content Metamorphosis - Stories Unfold in New Tongues
        translationRequests.push({
          text: postData.content,
          sourceLang: 'en',
          targetLang: langCode,
          context: 'content'
        })

        // 🌹 The Excerpt Enchantment - Essence Captured in Foreign Flowers
        translationRequests.push({
          text: postData.excerpt,
          sourceLang: 'en',
          targetLang: langCode,
          context: 'excerpt'
        })
      }

      // 🎨 Painting the Canvas of Progress - Initial Brushstrokes of Anticipation
      selectedLanguages.forEach(langCode => {
        updateTranslationStatus(langCode, { status: 'translating', progress: 10 })
      })

      setOverallProgress(10)

      // 🚀 The Grand Linguistic Launch - Sending Words to Their Destined Realms
    console.log(`🌐 ✨ ENCHANTED OBSERVATORY AWAKENS! ${translationRequests.length} linguistic spells to cast!`)
    console.log(`🎭 Chosen languages dance in harmony: ${selectedLanguages.join(', ')}`)
    console.log(`📜 Sacred trinity per realm: 3 (title, content, excerpt)`)
    console.log(`🎯 Total metamorphosis rituals: ${translationRequests.length}`)

    // 🌟 Summoning the Translation Spirits - The API Portal Opens
    const response = await fetch('/api/ai/translate-batch', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session authentication
      body: JSON.stringify({
        translations: translationRequests.map(req => ({
          text: req.text,
          target_language: req.targetLang,
          context: req.context
        })),
        source_language: 'en'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Translation API failed with status ${response.status}`)
    }

    const apiResult = await response.json()
    
    // Validate API response
    if (!apiResult.results || !Array.isArray(apiResult.results)) {
      throw new Error('Invalid API response: results array is missing')
    }

    // Convert API response to expected format with validation
    const results = apiResult.results.map((result: any, index: number) => {
      if (!result || typeof result !== 'object') {
        console.error(`Invalid result at index ${index}:`, result)
        return {
          translatedText: '',
          fromCache: false,
          tokensUsed: 0
        }
      }
      return {
        translatedText: result.translatedText || '',
        fromCache: result.fromCache || false,
        tokensUsed: result.tokensUsed || 0
      }
    })

    console.log(`🎉 ✨ LINGUISTIC ALCHEMY MASTERPIECE COMPLETE!`)
    console.log(`🏆 Triumphant transformations: ${results.filter((r: any) => r.translatedText && r.translatedText.length > 0).length}/${results.length}`)
    console.log(`💎 Crystallized wisdom from cache: ${results.filter((r: any) => r.fromCache).length}/${results.length}`)

      // 🎨 The Results Tapestry Weaving - Organizing Our Linguistic Treasures
      const languageResults = selectedLanguages.reduce((acc, langCode) => {
        acc[langCode] = {
          title: null,
          content: null,
          excerpt: null
        }
        return acc
      }, {} as Record<string, any>)

      results.forEach((result: any, index: number) => {
        if (!result || !result.translatedText) {
          console.error(`Skipping invalid result at index ${index}:`, result)
          return
        }

        const requestIndex = Math.floor(index / 3) // 3 items per language (title, content, excerpt)
        const langCode = selectedLanguages[requestIndex]
        const itemType = ['title', 'content', 'excerpt'][index % 3]

        if (!langCode || !languageResults[langCode]) {
          console.error(`Invalid language code at index ${index}:`, langCode)
          return
        }

        languageResults[langCode][itemType] = result.translatedText

        // Update progress for this language
        const completedItems = Object.values(languageResults[langCode]).filter(v => v !== null && v !== '').length
        const progress = Math.round((completedItems / 3) * 100)
        updateTranslationStatus(langCode, { progress })
      })

      setOverallProgress(100)

      // Update post data with translations
      const titleTranslations = { ...postData.title_translations }
      const contentTranslations = { ...postData.content_translations }
      const excerptTranslations = { ...postData.excerpt_translations }

      selectedLanguages.forEach(langCode => {
        if (languageResults[langCode].title) {
          titleTranslations[langCode] = languageResults[langCode].title
        }
        if (languageResults[langCode].content) {
          contentTranslations[langCode] = languageResults[langCode].content
        }
        if (languageResults[langCode].excerpt) {
          excerptTranslations[langCode] = languageResults[langCode].excerpt
        }

        updateTranslationStatus(langCode, { status: 'completed', progress: 100 })
      })

      // Update post data
      const updatedPostData = {
        ...postData,
        title_translations: titleTranslations,
        content_translations: contentTranslations,
        excerpt_translations: excerptTranslations
      }

      onDataUpdate(updatedPostData)

      logger.logApiUsage({
        provider: 'translation_system',
        operation: 'batch_translation_complete',
        correlationId
      })

      push({
        emoji: '✅',
        title: 'Translations completed!',
        description: `Successfully translated content to ${selectedLanguages.length} language(s).`,
        type: 'success'
      })

      // Auto-advance to next step after successful completion
      setTimeout(() => {
        console.log('🎯 Auto-advancing to next step...')
        onNext()
      }, 1000)

    } catch (error) {
      console.error('Translation error:', error)

      logger.logAiError('translation_system', 'batch_translation_failed', error, undefined, correlationId)

      // Mark failed languages
      selectedLanguages.forEach(langCode => {
        updateTranslationStatus(langCode, {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          progress: 0
        })
      })

      push({
        emoji: '❌',
        title: 'Translation failed',
        description: 'Some translations could not be completed. You can retry or continue with available translations.',
        type: 'error'
      })
    } finally {
      setIsTranslating(false)
    }
  }, [postData, selectedLanguages, push, onDataUpdate, onNext])

  // Auto-start translation when component mounts with valid data
  useEffect(() => {
    if (!hasStartedTranslation && postData?.title && postData?.content) {
      setHasStartedTranslation(true)
      // Small delay to ensure statuses are initialized
      setTimeout(() => handleTranslate(), 100)
    }
  }, [postData, hasStartedTranslation, handleTranslate])

  // 🌊 The Graceful Bypass - Choosing the Path of Single Language Eloquence  
  const handleSkip = () => {
    push({
      emoji: '⏭️',
      title: 'Skipping translations',
      description: 'You can add translations later from the post editor.',
      type: 'info'
    })
    onNext()
  }

  // 🎭 The Emotional Iconographer - Expressing States Through Sacred Symbols
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return '🌙' // Peaceful slumber before the magic begins
      case 'translating': return '✨' // Sparkling transformation in progress
      case 'completed': return '🌟' // Radiant completion, a star is born
      case 'failed': return '🌩️' // Storm clouds, but hope remains
      default: return '🔮' // Mystery awaits revelation
    }
  }

  // 🎨 The Palette of Progress - Colors That Speak to the Soul
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-gray-500' // Gentle twilight contemplation
      case 'translating': return 'text-blue-500' // Ocean depths of transformation
      case 'completed': return 'text-green-500' // Forest grove of accomplishment
      case 'failed': return 'text-red-500' // Sunset hues of temporary setback
      default: return 'text-gray-500' // Neutral harmony of the unknown
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🌐 Multilingual Translations</h2>
        <p className="text-gray-600">Automatically translating your content to Spanish and Hindi for global reach</p>
      </div>

      {/* Translation Status */}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Translation Status</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            translationStatuses.every(status => status.status === 'completed')
              ? 'bg-green-100 text-green-800'
              : translationStatuses.some(status => status.status === 'failed')
              ? 'bg-red-100 text-red-800'
              : isTranslating
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {translationStatuses.every(status => status.status === 'completed')
              ? '✅ All Complete'
              : translationStatuses.some(status => status.status === 'failed')
              ? '❌ Some Failed'
              : isTranslating
              ? '✨ In Progress'
              : '⏳ Starting...'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const status = translationStatuses.find(s => s.language === lang.code)

            return (
              <div
                key={lang.code}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  status?.status === 'completed' ? 'border-green-500 bg-green-50 text-green-700' :
                  status?.status === 'failed' ? 'border-red-500 bg-red-50 text-red-700' :
                  status?.status === 'translating' ? 'border-blue-500 bg-blue-50 text-blue-700' :
                  'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`text-sm ${getStatusColor(status?.status || 'idle')}`}>
                    {getStatusIcon(status?.status || 'idle')}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-xs text-gray-500">{lang.code.toUpperCase()}</div>
                  {status && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            status.status === 'completed' ? 'bg-green-500' :
                            status.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${status.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs mt-1 text-gray-600">
                        {status.status === 'completed' ? 'Complete' :
                         status.status === 'failed' ? 'Failed' :
                         status.status === 'translating' ? `${status.progress}%` :
                         'Waiting...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4">Content to Translate</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <p className="text-gray-900 bg-gray-50 p-2 rounded">{postData?.title || 'No title'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Content Preview</label>
            <p className="text-gray-900 bg-gray-50 p-2 rounded text-sm">
              {postData?.content?.substring(0, 100) || 'No content'}...
            </p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {isTranslating && (
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4">Translation Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          disabled={isTranslating}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Back
        </button>

        <div className="flex gap-3">
          {!isTranslating && translationStatuses.some(status => status.status === 'failed') && (
            <button
              onClick={handleTranslate}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              🔄 Retry Translation
            </button>
          )}
          
          {!isTranslating && (
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
            >
              Skip Translations
            </button>
          )}

          {isTranslating ? (
            <button
              disabled
              className="px-6 py-3 bg-blue-600 text-white rounded-xl opacity-50 cursor-not-allowed flex items-center gap-2"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Translating to Spanish & Hindi...
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!translationStatuses.every(status => status.status === 'completed')}
              className={`px-6 py-3 rounded-xl transition-colors ${
                translationStatuses.every(status => status.status === 'completed')
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={
                !translationStatuses.every(status => status.status === 'completed')
                  ? '🌟 Awaiting translation completion before proceeding to the mystical audio realm...'
                  : ''
              }
            >
              {translationStatuses.every(status => status.status === 'completed')
                ? 'Continue to Audio →'
                : '⏳ Waiting for Translations...'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
