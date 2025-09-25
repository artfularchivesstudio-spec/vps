'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

interface AudioJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audio_url?: string
  error_message?: string
  progress?: number
  created_at?: string
  completed_at?: string
  languages?: string[]
  language_statuses?: Record<string, {
    status: string
    audio_url?: string
    draft?: boolean
  }>
  audio_urls?: Record<string, string>
}

interface AudioStatusCardProps {
  jobId: string
  onRegenerateAudio?: () => void
  onAddLanguage?: () => void
  onRegenerateLanguage?: (language: string) => void
}

export default function AudioStatusCard({ jobId, onRegenerateAudio, onAddLanguage, onRegenerateLanguage }: AudioStatusCardProps) {
  const [status, setStatus] = useState<AudioJobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [regeneratingLanguages, setRegeneratingLanguages] = useState<Set<string>>(new Set())
  const { push } = useToast()

  const fetchStatus = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/audio-job-status/${jobId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setStatus(data)
      setLastChecked(new Date())
      
      // Clear regenerating flags for languages that are now complete
      if (data.language_statuses) {
        setRegeneratingLanguages(prev => {
          const newSet = new Set(prev)
          Object.entries(data.language_statuses).forEach(([lang, langStatus]: [string, any]) => {
            if ((langStatus.status === 'completed' || langStatus.status === 'complete') && newSet.has(lang)) {
              newSet.delete(lang)
            }
          })
          return newSet
        })
      }
      
      // Stop polling if job is completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false)
        
        if (data.status === 'completed') {
          push({
            emoji: '🎵',
            title: 'Audio Ready!',
            description: 'Your audio narration has been generated successfully.',
            type: 'success'
          })
        } else if (data.status === 'failed') {
          push({
            emoji: '❌',
            title: 'Audio Generation Failed',
            description: data.error_message || 'Unknown error occurred',
            type: 'error'
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch audio status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    }
  }, [jobId, push])

  // Initial fetch and polling setup
  useEffect(() => {
    if (!jobId) return

    fetchStatus() // Initial fetch

    if (!isPolling) return

    const interval = setInterval(() => {
      if (isPolling) {
        fetchStatus()
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [jobId, isPolling, fetchStatus])

  const handleTogglePolling = () => {
    setIsPolling(!isPolling)
    if (!isPolling) {
      fetchStatus() // Fetch immediately when resuming polling
    }
  }

  const handleCopyJobId = async () => {
    try {
      await navigator.clipboard.writeText(jobId)
      push({
        emoji: '📋',
        title: 'Job ID Copied',
        description: jobId,
        type: 'success',
        durationMs: 2000
      })
    } catch {
      // Fallback - select text if clipboard API fails
      console.log('Clipboard API failed, job ID:', jobId)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'complete': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'complete': return '✅'
      case 'failed': return '❌'
      case 'processing': return '🔄'
      case 'pending': return '⏳'
      default: return '❓'
    }
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleTimeString()
    } catch {
      return '—'
    }
  }

  const getLanguageDisplayName = (lang: string) => {
    switch (lang) {
      case 'en': return 'English'
      case 'es': return 'Spanish' 
      case 'hi': return 'Hindi'
      default: return lang.toUpperCase()
    }
  }

  const getLanguageEmoji = (lang: string) => {
    switch (lang) {
      case 'en': return '🇺🇸'
      case 'es': return '🇪🇸'
      case 'hi': return '🇮🇳'
      default: return '🌍'
    }
  }

  if (!jobId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">No audio job was created for this post.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          🎵 Audio Generation Status
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePolling}
            className={`px-3 py-1 text-xs rounded-md font-medium ${
              isPolling 
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isPolling ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">⚠️ Error: {error}</p>
          <button
            onClick={fetchStatus}
            className="mt-2 text-xs text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {status ? (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
              {getStatusIcon(status.status)} {status.status?.toUpperCase()}
            </span>
            {status.progress && (
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-600">Job ID</dt>
              <dd className="text-gray-900 font-mono text-xs break-all">{jobId}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Created</dt>
              <dd className="text-gray-900">{formatTime(status.created_at)}</dd>
            </div>
            {status.completed_at && (
              <div>
                <dt className="font-medium text-gray-600">Completed</dt>
                <dd className="text-gray-900">{formatTime(status.completed_at)}</dd>
              </div>
            )}
            {lastChecked && (
              <div>
                <dt className="font-medium text-gray-600">Last Checked</dt>
                <dd className="text-gray-900">{lastChecked.toLocaleTimeString()}</dd>
              </div>
            )}
          </div>

          {/* Error Message */}
          {status.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{status.error_message}</p>
            </div>
          )}

          {/* Per-Language Status */}
          {status.languages && status.languages.length > 1 && status.language_statuses && (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">🌍 Language Progress</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {status.languages.map((lang) => {
                  const langStatus = status.language_statuses?.[lang]
                  const audioUrl = status.audio_urls?.[lang] || langStatus?.audio_url
                  const isDraft = langStatus?.draft === true
                  const isRegenerating = regeneratingLanguages.has(lang)
                  
                  // Override status if regenerating
                  const displayStatus = isRegenerating ? 'processing' : langStatus?.status || 'pending'
                  const showPlayButton = audioUrl && !isRegenerating && (displayStatus === 'completed' || displayStatus === 'complete')
                  
                  return (
                    <div key={lang} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getLanguageEmoji(lang)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getLanguageDisplayName(lang)}
                            {isDraft && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                                Draft
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isRegenerating ? 'regenerating...' : displayStatus}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          getStatusColor(displayStatus)
                        }`}>
                          {getStatusIcon(displayStatus)} {displayStatus.toUpperCase()}
                        </span>
                        {showPlayButton && (
                          <a
                            href={audioUrl}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            🎵 Play
                          </a>
                        )}
                        <button
                          onClick={() => {
                            if (onRegenerateLanguage) {
                              // Immediately mark as regenerating for UI feedback
                              setRegeneratingLanguages(prev => new Set(Array.from(prev).concat(lang)));
                              onRegenerateLanguage(lang);
                            } else {
                              push({
                                emoji: '🔄',
                                title: 'Regenerate Audio',
                                description: `Language-specific regeneration not implemented yet`,
                                type: 'info'
                              })
                            }
                          }}
                          disabled={isRegenerating}
                          className={`px-2 py-1 text-xs rounded ${
                            isRegenerating 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                          title={`Regenerate ${getLanguageDisplayName(lang)} audio`}
                        >
                          {isRegenerating ? '⏳ Regen...' : '🔄 Regen'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individual Audio Players for Each Language */}
          {status.languages && status.languages.length > 0 && (
            <div className="space-y-3">
              {status.languages
                .filter(lang => {
                  const langStatus = status.language_statuses?.[lang]
                  const audioUrl = status.audio_urls?.[lang] || langStatus?.audio_url
                  const isRegenerating = regeneratingLanguages.has(lang)
                  return audioUrl && !isRegenerating && (langStatus?.status === 'completed' || langStatus?.status === 'complete')
                })
                .map((lang) => {
                  const langStatus = status.language_statuses?.[lang]
                  const audioUrl = status.audio_urls?.[lang] || langStatus?.audio_url
                  const isDraft = langStatus?.draft === true
                  
                  return (
                    <div key={lang} className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        {getLanguageEmoji(lang)} {getLanguageDisplayName(lang)} Audio Ready!
                        {isDraft && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                            Draft
                          </span>
                        )}
                      </h4>
                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="mt-2 flex gap-2">
                        <a
                          href={audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 underline hover:text-green-800"
                        >
                          Open in new tab
                        </a>
                        <a
                          href={audioUrl}
                          download={`post-audio-${lang}-${jobId}.mp3`}
                          className="text-xs text-green-600 underline hover:text-green-800"
                        >
                          Download {getLanguageDisplayName(lang)}
                        </a>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
          
          {/* Fallback: Single Audio Player if no language-specific data */}
          {status.audio_url && (!status.languages || status.languages.length <= 1) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">🎵 Audio Ready!</h4>
              <audio controls className="w-full">
                <source src={status.audio_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div className="mt-2 flex gap-2">
                <a
                  href={status.audio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 underline hover:text-green-800"
                >
                  Open in new tab
                </a>
                <a
                  href={status.audio_url}
                  download={`post-audio-${jobId}.mp3`}
                  className="text-xs text-green-600 underline hover:text-green-800"
                >
                  Download
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyJobId}
              className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              📋 Copy Job ID
            </button>
            <button
              onClick={fetchStatus}
              disabled={isPolling}
              className="px-3 py-1 text-xs rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 disabled:opacity-50"
            >
              🔄 Refresh Now
            </button>
            
            {onRegenerateAudio && (
              <button
                onClick={onRegenerateAudio}
                className="px-3 py-1 text-xs rounded-md bg-orange-100 hover:bg-orange-200 text-orange-700"
              >
                🔄 Regenerate Audio
              </button>
            )}
            
            {onAddLanguage && status.status === 'completed' && (
              <button
                onClick={onAddLanguage}
                className="px-3 py-1 text-xs rounded-md bg-purple-100 hover:bg-purple-200 text-purple-700"
              >
                🌍 Add Language
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading status...</span>
        </div>
      )}
    </div>
  )
}