'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';

interface AudioJob {
  id: string
  post_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audio_urls: Record<string, string> // { "en": "url", "es": "url" }
  subtitle_urls: Record<string, string>
  srt_urls: Record<string, string>
  vtt_urls: Record<string, string>
  translated_texts: Record<string, string>
  progress: Record<string, number> // Progress per language
  error_message?: string
  created_at: string
  updated_at: string
}

interface VoiceSettings {
  language: string
  voice_id: string
  voice_name: string
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
  persona: 'art_dealer' | 'curator' | 'academic' | 'casual'
}

interface Language {
  code: string
  name: string
  flag: string
  voice_options: Array<{
    id: string
    name: string
    gender: 'male' | 'female'
    accent: string
  }>
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    voice_options: [
      { id: 'en_voice_1', name: 'Marcus (Art Dealer)', gender: 'male', accent: 'US' },
      { id: 'en_voice_2', name: 'Victoria (Curator)', gender: 'female', accent: 'UK' },
      { id: 'en_voice_3', name: 'Samuel (Academic)', gender: 'male', accent: 'US' }
    ]
  },
  {
    code: 'es',
    name: 'Spanish',
    flag: '🇪🇸',
    voice_options: [
      { id: 'es_voice_1', name: 'Carlos (Galerista)', gender: 'male', accent: 'ES' },
      { id: 'es_voice_2', name: 'Isabella (Curadora)', gender: 'female', accent: 'MX' },
      { id: 'es_voice_3', name: 'Diego (Académico)', gender: 'male', accent: 'AR' }
    ]
  },
  {
    code: 'hi',
    name: 'Hindi',
    flag: '🇮🇳',
    voice_options: [
      { id: 'hi_voice_1', name: 'Raj (कला व्यापारी)', gender: 'male', accent: 'IN' },
      { id: 'hi_voice_2', name: 'Priya (संग्रहाध्यक्ष)', gender: 'female', accent: 'IN' },
      { id: 'hi_voice_3', name: 'Arjun (शैक्षणिक)', gender: 'male', accent: 'IN' }
    ]
  }
]

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  language: 'en',
  voice_id: 'en_voice_1',
  voice_name: 'Marcus (Art Dealer)',
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0.3,
  use_speaker_boost: true,
  persona: 'art_dealer'
}

interface AudioControlCenterProps {
  className?: string
  postId?: string
}

export default function AudioControlCenter({ className, postId }: AudioControlCenterProps) {
  const [activeTab, setActiveTab] = useState<'jobs'>('jobs')
  const [audioJobs, setAudioJobs] = useState<AudioJob[]>([])
  const [selectedJob, setSelectedJob] = useState<AudioJob | null>(null)
  const [voiceSettings, setVoiceSettings] = useState<Record<string, VoiceSettings>>({
    en: { ...DEFAULT_VOICE_SETTINGS, language: 'en' },
    es: { ...DEFAULT_VOICE_SETTINGS, language: 'es', voice_id: 'es_voice_1', voice_name: 'Carlos (Galerista)' },
    hi: { ...DEFAULT_VOICE_SETTINGS, language: 'hi', voice_id: 'hi_voice_1', voice_name: 'Raj (कला व्यापारी)' }
  })
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null)
  const [isPlayingTest, setIsPlayingTest] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchAudioJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tools/audio-status');
      if (!response.ok) {
        throw new Error('Failed to fetch audio status');
      }
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.audioJobs)) {
        setAudioJobs(data.data.audioJobs);
      } else {
        console.error('Fetched data is not in the expected format:', data);
        setAudioJobs([]); // Set to empty array if data is invalid
      }
    } catch (error) {
      console.error('Error fetching audio jobs:', error);
      setAudioJobs([]); // Also set to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudioJobs()
    const interval = setInterval(fetchAudioJobs, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [fetchAudioJobs])

  const generateAudio = async (postId: string, language: string) => {
    setIsGenerating(prev => ({ ...prev, [`${postId}-${language}`]: true }))

    try {
      const response = await fetch('/api/ai/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          languages: [language],
          voice_settings: voiceSettings[language],
          is_draft: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      const result = await response.json()
      console.log('Audio generation started:', result)

      // Refresh jobs after starting generation
      setTimeout(fetchAudioJobs, 1000)
    } catch (error) {
      console.error('Error generating audio:', error)
    } finally {
      setIsGenerating(prev => ({ ...prev, [`${postId}-${language}`]: false }))
    }
  }

  const regenerateAudio = async (jobId: string, language: string) => {
    setIsGenerating(prev => ({ ...prev, [`regenerate-${jobId}-${language}`]: true }))

    try {
      const response = await fetch('/api/admin/tools/regenerate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          language: language,
          force_regeneration: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate audio')
      }

      const result = await response.json()
      console.log('Audio regeneration started:', result)

      // Refresh jobs after starting regeneration
      setTimeout(fetchAudioJobs, 2000)
    } catch (error) {
      console.error('Error regenerating audio:', error)
    } finally {
      setIsGenerating(prev => ({ ...prev, [`regenerate-${jobId}-${language}`]: false }))
    }
  }

  const generateTestAudio = async (language: string) => {
    setIsGenerating(prev => ({ ...prev, [`test-${language}`]: true }))
    
    try {
      const testText = "This is a test of the audio generation system with the selected voice settings."
      
      const response = await fetch('/api/ai/generate-audio-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          language,
          voice_settings: voiceSettings[language]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate test audio')
      }

      const result = await response.json()
      setTestAudioUrl(result.audio_url)
    } catch (error) {
      console.error('Error generating test audio:', error)
    } finally {
      setIsGenerating(prev => ({ ...prev, [`test-${language}`]: false }))
    }
  }

  const updateVoiceSettings = (language: string, updates: Partial<VoiceSettings>) => {
    setVoiceSettings(prev => ({
      ...prev,
      [language]: { ...prev[language], ...updates }
    }))
  }

  const playTestAudio = () => {
    if (audioRef.current && testAudioUrl) {
      audioRef.current.src = testAudioUrl
      audioRef.current.play()
      setIsPlayingTest(true)
    }
  }

  const stopTestAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlayingTest(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Audio Control Center</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage multilingual audio generation with language-specific voice controls
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'jobs', label: 'Audio Jobs', icon: '🎵' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                {audioJobs && audioJobs.length > 0 && audioJobs.map(job => (
                  <div key={job.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">Post ID: {job.post_id}</h3>
                        <p className="text-sm text-gray-600">
                          Status: <span className={`font-medium ${
                            job.status === 'completed' ? 'text-green-600' :
                            job.status === 'processing' ? 'text-yellow-600' :
                            job.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                          }`}>{job.status}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <div key={lang.code} className="flex gap-1">
                            <button
                              onClick={() => generateAudio(job.post_id, lang.code)}
                              disabled={isGenerating[`${job.post_id}-${lang.code}`]}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                job.audio_urls?.[lang.code]
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800 hover:bg-blue-100 hover:text-blue-800'
                              } ${isGenerating[`${job.post_id}-${lang.code}`] ? 'opacity-50' : ''}`}
                            >
                              {isGenerating[`${job.post_id}-${lang.code}`] ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                  {lang.flag}
                                </div>
                              ) : (
                                `${lang.flag} ${lang.code.toUpperCase()}`
                              )}
                            </button>
                            {job.audio_urls?.[lang.code] && (
                              <button
                                onClick={() => regenerateAudio(job.id, lang.code)}
                                disabled={isGenerating[`regenerate-${job.id}-${lang.code}`]}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors bg-orange-100 text-orange-800 hover:bg-orange-200 ${
                                  isGenerating[`regenerate-${job.id}-${lang.code}`] ? 'opacity-50' : ''
                                }`}
                                title={`Regenerate ${lang.name} audio with proper translation`}
                              >
                                {isGenerating[`regenerate-${job.id}-${lang.code}`] ? (
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  '🔄'
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Language Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {SUPPORTED_LANGUAGES.map(lang => {
                        const hasAudio = job.audio_urls?.[lang.code]
                        const progress = job.progress?.[lang.code] || 0
                        const isComplete = progress === 100
                        const isGeneratingThis = isGenerating[`${job.post_id}-${lang.code}`]
                        const isRegeneratingThis = isGenerating[`regenerate-${job.id}-${lang.code}`]

                        return (
                          <div key={lang.code} className={`rounded p-3 border-2 transition-all duration-200 ${
                            hasAudio && isComplete
                              ? 'bg-green-50 border-green-200'
                              : isGeneratingThis || isRegeneratingThis
                               ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <span>{lang.flag}</span>
                                {lang.name}
                              </span>
                              <div className="flex items-center gap-2">
                                {hasAudio && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    ✓ Audio
                                  </span>
                                )}
                                <span className="text-sm text-gray-600">
                                  {progress}%
                                </span>
                              </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isComplete ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>

                            {/* Status Messages */}
                            {isRegeneratingThis && (
                              <div className="text-xs text-orange-600 mb-2 flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                Regenerating with proper translation...
                              </div>
                            )}

                            {isGeneratingThis && !isRegeneratingThis && (
                              <div className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                Generating audio...
                              </div>
                            )}

                            {/* Audio Player */}
                            {hasAudio && (
                              <div className="mt-2">
                                <audio
                                  controls
                                  className="w-full h-8"
                                  src={job.audio_urls?.[lang.code]}
                                >
                                  <track
                                    kind="subtitles"
                                    src={job.vtt_urls?.[lang.code]}
                                    srcLang={lang.code}
                                    label={lang.name}
                                  />
                                </audio>
                                <div className="text-xs text-gray-500 mt-1">
                                  Duration: {job.audio_urls?.[lang.code]?.includes('full') ? 'Full' : 'Chunk'}
                                </div>
                              </div>
                            )}

                            {/* Subtitle Links */}
                            {(job.srt_urls?.[lang.code] || job.vtt_urls?.[lang.code]) && (
                              <div className="mt-2 flex gap-2">
                                {job.srt_urls?.[lang.code] && (
                                  <a
                                    href={job.srt_urls?.[lang.code]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    SRT
                                  </a>
                                )}
                                {job.vtt_urls?.[lang.code] && (
                                  <a
                                    href={job.vtt_urls?.[lang.code]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    VTT
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Language Quality Indicator */}
                            {hasAudio && (
                              <div className="mt-2 text-xs text-gray-600">
                                Quality: {job.translated_texts?.[lang.code] ? 'Translated' : 'Original'}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {(!audioJobs || audioJobs.length === 0) && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    No audio jobs found. Generate audio for your posts to see them here.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {false && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <div key={lang.code} className="border rounded-lg p-6 bg-gray-50">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{lang.flag}</span>
                      <h3 className="text-lg font-medium text-gray-900">{lang.name} Voice Settings</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Voice Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Voice Character
                        </label>
                        <select
                          value={voiceSettings[lang.code]?.voice_id || ''}
                          onChange={(e) => {
                            const selectedVoice = lang.voice_options.find(v => v.id === e.target.value)
                            updateVoiceSettings(lang.code, {
                              voice_id: e.target.value,
                              voice_name: selectedVoice?.name || ''
                            })
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          {lang.voice_options.map(voice => (
                            <option key={voice.id} value={voice.id}>
                              {voice.name} ({voice.gender}, {voice.accent})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Persona */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Speaking Style
                        </label>
                        <select
                          value={voiceSettings[lang.code]?.persona || 'art_dealer'}
                          onChange={(e) => updateVoiceSettings(lang.code, { persona: e.target.value as any })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="art_dealer">Art Dealer (Professional, Persuasive)</option>
                          <option value="curator">Curator (Scholarly, Thoughtful)</option>
                          <option value="academic">Academic (Formal, Detailed)</option>
                          <option value="casual">Casual (Friendly, Accessible)</option>
                        </select>
                      </div>

                      {/* Voice Parameters */}
                      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stability: {voiceSettings[lang.code]?.stability?.toFixed(1) || '0.5'}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={voiceSettings[lang.code]?.stability || 0.5}
                            onChange={(e) => updateVoiceSettings(lang.code, { stability: parseFloat(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clarity: {voiceSettings[lang.code]?.similarity_boost?.toFixed(1) || '0.8'}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={voiceSettings[lang.code]?.similarity_boost || 0.8}
                            onChange={(e) => updateVoiceSettings(lang.code, { similarity_boost: parseFloat(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Style: {voiceSettings[lang.code]?.style?.toFixed(1) || '0.3'}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={voiceSettings[lang.code]?.style || 0.3}
                            onChange={(e) => updateVoiceSettings(lang.code, { style: parseFloat(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={voiceSettings[lang.code]?.use_speaker_boost || false}
                              onChange={(e) => updateVoiceSettings(lang.code, { use_speaker_boost: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Speaker Boost
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {false && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Voice Testing</h3>
                  <p className="text-sm text-gray-600">
                    Test voice settings before generating audio for your content
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <div key={lang.code} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{lang.flag}</span>
                        <h4 className="font-medium text-gray-900">{lang.name}</h4>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p><strong>Voice:</strong> {voiceSettings[lang.code]?.voice_name}</p>
                        <p><strong>Style:</strong> {voiceSettings[lang.code]?.persona}</p>
                        <p><strong>Settings:</strong> S:{voiceSettings[lang.code]?.stability?.toFixed(1)} | C:{voiceSettings[lang.code]?.similarity_boost?.toFixed(1)} | St:{voiceSettings[lang.code]?.style?.toFixed(1)}</p>
                      </div>

                      <button
                        onClick={() => generateTestAudio(lang.code)}
                        disabled={isGenerating[`test-${lang.code}`]}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isGenerating[`test-${lang.code}`] ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </div>
                        ) : (
                          'Generate Test Audio'
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Test Audio Player */}
                {testAudioUrl && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-blue-900">Test Audio Generated</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={playTestAudio}
                          disabled={isPlayingTest}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isPlayingTest ? 'Playing...' : 'Play'}
                        </button>
                        <button
                          onClick={stopTestAudio}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                    <audio
                      ref={audioRef}
                      controls
                      className="w-full"
                      onEnded={() => setIsPlayingTest(false)}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden audio element for test playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}

// Helper function to render job status badge
const renderJobStatus = (status: AudioJob['status']) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default">Completed</Badge>
    case 'processing':
      return <Badge variant="secondary">Processing</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}