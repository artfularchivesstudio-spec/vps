'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { useToast } from '@/components/ui/ToastProvider'
import { useState } from 'react'

// Available languages for bulk operations
const AVAILABLE_LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
]

interface BulkActionsProps {
  selectedPosts: string[]
  onSelectionChange: (postIds: string[]) => void
  onBulkActionComplete: () => void
}

export const BulkActions = ({ selectedPosts, onSelectionChange, onBulkActionComplete }: BulkActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTranslationOptions, setShowTranslationOptions] = useState(false)
  const [showAudioOptions, setShowAudioOptions] = useState(false)
  const [selectedTranslationLangs, setSelectedTranslationLangs] = useState<string[]>([])
  const [selectedAudioLangs, setSelectedAudioLangs] = useState<string[]>([])
  const { push } = useToast()

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) {
      push({ emoji: '⚠️', title: 'No posts selected', description: 'Please select posts to delete', type: 'warning' })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} post(s)? This action cannot be undone.`)) {
      return
    }

    setIsProcessing(true)
    let deleted = 0
    let failed = 0

    try {
      for (const postId of selectedPosts) {
        try {
          const response = await fetch(`/api/admin/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          })

          if (response.ok) {
            deleted++
          } else {
            failed++
          }
        } catch (error) {
          console.error(`Failed to delete post ${postId}:`, error)
          failed++
        }
      }

      if (deleted > 0) {
        push({ 
          emoji: '🗑️', 
          title: `Deleted ${deleted} post(s)`, 
          description: failed > 0 ? `${failed} failed to delete` : 'All selected posts deleted successfully',
          type: failed > 0 ? 'warning' : 'success' 
        })
      }

      if (failed > 0) {
        push({ 
          emoji: '❌', 
          title: 'Some deletions failed', 
          description: `${failed} post(s) could not be deleted`, 
          type: 'error' 
        })
      }

      onSelectionChange([])
      onBulkActionComplete()
    } catch (error) {
      console.error('Bulk delete error:', error)
      push({ emoji: '❌', title: 'Bulk delete failed', description: 'An unexpected error occurred', type: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkStatusChange = async (status: 'draft' | 'published' | 'archived') => {
    if (selectedPosts.length === 0) {
      push({ emoji: '⚠️', title: 'No posts selected', description: 'Please select posts to update', type: 'warning' })
      return
    }

    setIsProcessing(true)
    let updated = 0
    let failed = 0

    try {
      for (const postId of selectedPosts) {
        try {
          const response = await fetch(`/api/admin/posts/${postId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          })

          if (response.ok) {
            updated++
          } else {
            failed++
          }
        } catch (error) {
          console.error(`Failed to update post ${postId}:`, error)
          failed++
        }
      }

      if (updated > 0) {
        push({
          emoji: '✅',
          title: `Updated ${updated} post(s)`,
          description: failed > 0 ? `${failed} failed to update` : 'All selected posts updated successfully',
          type: failed > 0 ? 'warning' : 'success'
        })
      }

      if (failed > 0) {
        push({
          emoji: '❌',
          title: 'Some updates failed',
          description: `${failed} post(s) could not be updated`,
          type: 'error'
        })
      }

      onBulkActionComplete()
    } catch (error) {
      console.error('Bulk status update error:', error)
      push({ emoji: '❌', title: 'Bulk update failed', description: 'An unexpected error occurred', type: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkTranslation = async (languages: string[]) => {
    if (selectedPosts.length === 0) {
      push({ emoji: '⚠️', title: 'No posts selected', description: 'Please select posts to translate', type: 'warning' })
      return
    }

    if (languages.length === 0) {
      push({ emoji: '⚠️', title: 'No languages selected', description: 'Please select languages for translation', type: 'warning' })
      return
    }

    setIsProcessing(true)
    let processed = 0
    let failed = 0

    try {
      console.log(`🌐 🚀 BULK TRANSLATION QUEST BEGINS!`)
      console.log(`📊 Selected posts: ${selectedPosts.length}`)
      console.log(`🌍 Target languages: ${languages.join(', ')}`)

      for (const postId of selectedPosts) {
        try {
          console.log(`📝 Processing post ${processed + 1}/${selectedPosts.length}: ${postId}`)

          const response = await fetch('/api/ai/translate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              translations: languages.flatMap(lang => [
                { text: `Post content for ${postId}`, target_language: lang, context: 'content' },
                { text: `Post title for ${postId}`, target_language: lang, context: 'title' },
                { text: `Post excerpt for ${postId}`, target_language: lang, context: 'excerpt' }
              ]),
              source_language: 'en'
            })
          })

          if (response.ok) {
            processed++
            console.log(`✅ Post ${postId} translations completed`)
          } else {
            failed++
            console.log(`❌ Post ${postId} translation failed: ${response.status}`)
          }
        } catch (error) {
          console.error(`Failed to translate post ${postId}:`, error)
          failed++
        }
      }

      if (processed > 0) {
        push({
          emoji: '🌐',
          title: `Translated ${processed} post(s)`,
          description: `Generated translations in: ${languages.join(', ')}`,
          type: 'success'
        })
      }

      if (failed > 0) {
        push({
          emoji: '⚠️',
          title: 'Some translations failed',
          description: `${failed} post(s) could not be translated`,
          type: 'warning'
        })
      }

      onBulkActionComplete()
    } catch (error) {
      console.error('Bulk translation error:', error)
      push({ emoji: '❌', title: 'Bulk translation failed', description: 'An unexpected error occurred', type: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkAudioGeneration = async (languages: string[]) => {
    if (selectedPosts.length === 0) {
      push({ emoji: '⚠️', title: 'No posts selected', description: 'Please select posts to generate audio for', type: 'warning' })
      return
    }

    if (languages.length === 0) {
      push({ emoji: '⚠️', title: 'No languages selected', description: 'Please select languages for audio generation', type: 'warning' })
      return
    }

    setIsProcessing(true)
    let processed = 0
    let failed = 0

    try {
      console.log(`🎵 🎙️ BULK AUDIO GENERATION SPECTACULAR!`)
      console.log(`📊 Selected posts: ${selectedPosts.length}`)
      console.log(`🌍 Target languages: ${languages.join(', ')}`)

      for (const postId of selectedPosts) {
        try {
          console.log(`🎵 Processing post ${processed + 1}/${selectedPosts.length}: ${postId}`)

          const response = await fetch('/api/audio-jobs/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: postId,
              languages: languages
            })
          })

          if (response.ok) {
            processed++
            console.log(`✅ Post ${postId} audio jobs created`)
          } else {
            failed++
            console.log(`❌ Post ${postId} audio generation failed: ${response.status}`)
          }
        } catch (error) {
          console.error(`Failed to generate audio for post ${postId}:`, error)
          failed++
        }
      }

      if (processed > 0) {
        push({
          emoji: '🎵',
          title: `Audio jobs created for ${processed} post(s)`,
          description: `Generating audio in: ${languages.join(', ')}`,
          type: 'success'
        })
      }

      if (failed > 0) {
        push({
          emoji: '⚠️',
          title: 'Some audio jobs failed',
          description: `${failed} post(s) could not have audio generated`,
          type: 'warning'
        })
      }

      onBulkActionComplete()
    } catch (error) {
      console.error('Bulk audio generation error:', error)
      push({ emoji: '❌', title: 'Bulk audio generation failed', description: 'An unexpected error occurred', type: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  if (selectedPosts.length === 0) return null

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 font-semibold">
              🚀 {selectedPosts.length} selected
            </Badge>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bulk Operations Available
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕ Clear Selection
          </Button>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Translation Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📝</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Translations</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranslationOptions(!showTranslationOptions)}
                disabled={isProcessing}
                className="text-xs"
              >
                {showTranslationOptions ? '↑' : '↓'}
              </Button>
            </div>

            {showTranslationOptions && (
              <div className="space-y-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_LANGUAGES.slice(0, 6).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedTranslationLangs(prev =>
                          prev.includes(lang.code)
                            ? prev.filter(l => l !== lang.code)
                            : [...prev, lang.code]
                        )
                      }}
                      className={`flex items-center space-x-2 p-2 rounded-md text-xs border transition-colors ${
                        selectedTranslationLangs.includes(lang.code)
                          ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTranslationLangs(AVAILABLE_LANGUAGES.map(l => l.code))}
                    className="text-xs flex-1"
                    disabled={isProcessing}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTranslationLangs([])}
                    className="text-xs flex-1"
                    disabled={isProcessing}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={() => handleBulkTranslation(selectedTranslationLangs)}
              disabled={isProcessing || selectedTranslationLangs.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {isProcessing ? '🔄 Processing...' : `🌐 Translate (${selectedTranslationLangs.length})`}
            </Button>
          </div>

          {/* Audio Generation Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎙️</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Audio Generation</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAudioOptions(!showAudioOptions)}
                disabled={isProcessing}
                className="text-xs"
              >
                {showAudioOptions ? '↑' : '↓'}
              </Button>
            </div>

            {showAudioOptions && (
              <div className="space-y-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_LANGUAGES.slice(0, 6).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedAudioLangs(prev =>
                          prev.includes(lang.code)
                            ? prev.filter(l => l !== lang.code)
                            : [...prev, lang.code]
                        )
                      }}
                      className={`flex items-center space-x-2 p-2 rounded-md text-xs border transition-colors ${
                        selectedAudioLangs.includes(lang.code)
                          ? 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAudioLangs(AVAILABLE_LANGUAGES.map(l => l.code))}
                    className="text-xs flex-1"
                    disabled={isProcessing}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAudioLangs([])}
                    className="text-xs flex-1"
                    disabled={isProcessing}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={() => handleBulkAudioGeneration(selectedAudioLangs)}
              disabled={isProcessing || selectedAudioLangs.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {isProcessing ? '🔄 Processing...' : `🎵 Generate Audio (${selectedAudioLangs.length})`}
            </Button>
          </div>

          {/* Status Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">📊</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Status Updates</span>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('published')}
                disabled={isProcessing}
                className="w-full justify-start text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
              >
                ✅ Publish All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('draft')}
                disabled={isProcessing}
                className="w-full justify-start text-yellow-700 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:hover:bg-yellow-900/20"
              >
                📝 Draft All
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-800 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-red-900 dark:text-red-100">Danger Zone</span>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? '🔄 Processing...' : '🗑️ Delete All'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const BulkSelectHeader = ({ 
  allSelected, 
  onSelectAll, 
  indeterminate 
}: { 
  allSelected: boolean
  onSelectAll: (selected: boolean) => void
  indeterminate: boolean
}) => {
  return (
    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">
      <Checkbox
        checked={allSelected}
        onChange={(e) => onSelectAll(e.target.checked)}
        aria-label="Select all posts"
        indeterminate={indeterminate}
      />
    </th>
  )
}