'use client'

import { useToast } from '@/components/ui/ToastProvider'
import { useEffect, useMemo, useState } from 'react'
import { usePostData } from '@/hooks/usePostData'
import { AudioJobData } from '@/types/api'
import apiClient, { APIError } from '@/lib/api/client'

interface AudioStepProps {
  onNext: (audioData: AudioData) => void
  onBack: () => void
  postData: any
}

// 🎭 Enhanced audio data structure with theatrical flair
interface AudioData {
  jobId: string | null
  immediateUrls?: Record<string, string> // Language -> URL mapping for immediate audio
  status: 'immediate' | 'processing' | 'none'
  audioJob?: AudioJobData // Full job data for enhanced tracking
}

type VoiceGender = 'male' | 'female'
type Personality = 'art_dealer' | 'art_instructor' | 'hybrid'
type TtsProvider = 'openai' | 'elevenlabs'

export default function AudioStep({ onNext, onBack, postData }: AudioStepProps) {
  const [languages, setLanguages] = useState<string[]>(['en'])
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female')
  const [personality, setPersonality] = useState<Personality>('hybrid')
  const [speed, setSpeed] = useState<number>(0.9)
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>('openai')
  const [isDraft, setIsDraft] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<string>('nova')
  const [isSampling, setIsSampling] = useState<boolean>(false)
  const [availableVoices, setAvailableVoices] = useState<Array<{ id: string; label: string; gender: string; tags: string[]; languages: string[] }>>([])
  const [voiceQuery, setVoiceQuery] = useState<string>('')
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const { push } = useToast()

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  useEffect(() => {
    if (ttsProvider !== 'openai') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/ai/voices')
        if (!res.ok) throw new Error('Failed to load voices')
        const data = await res.json()
        if (!cancelled) {
          setAvailableVoices(data.voices || [])
          if (!selectedVoice && data.voices?.length) setSelectedVoice(data.voices[0].id)
        }
      } catch {
        // ignore; UI will fallback to curated defaults when empty
      }
    })()
    return () => { cancelled = true }
  }, [ttsProvider, selectedVoice])

  // Auto-select languages based on available translations
  useEffect(() => {
    if (!postData) return;
    
    const availableLanguages = ['en']; // Always include English
    
    // Check for translated content
    if (postData.content_translations) {
      Object.keys(postData.content_translations).forEach(lang => {
        if (postData.content_translations[lang] && !availableLanguages.includes(lang)) {
          availableLanguages.push(lang);
        }
      });
    }
    
    // Auto-select all available languages
    if (availableLanguages.length > 1) {
      console.log('🌍 Auto-selecting translated languages:', availableLanguages);
      setLanguages(availableLanguages);
    }
  }, [postData]);

  const filteredVoices = useMemo(() => {
    let list = availableVoices
    if (voiceGenderFilter !== 'all') {
      list = list.filter(v => v.gender === voiceGenderFilter)
    }
    if (voiceQuery.trim()) {
      const q = voiceQuery.toLowerCase()
      list = list.filter(v => v.id.toLowerCase().includes(q) || v.label.toLowerCase().includes(q) || v.tags.some(t => t.includes(q)))
    }
    return list
  }, [availableVoices, voiceGenderFilter, voiceQuery])

  // 🎭 The Grand Audio Generation Performance - Now with API Client Magic! ✨
  const handleGenerate = async () => {
    console.info('🎙️ AudioStep: Generate clicked - using our magnificent new API architecture!')
    setError(null)
    setIsSubmitting(true)
    let startedAt = Date.now()
    
    try {
      const postId = postData?.savedPostId

      if (!postId) {
        throw new Error('Missing saved post ID. Please go back and save the post first.')
      }

      // 🎭 **VALIDATION THEATER**: Ensure translations are complete before audio generation
      const missingTranslations = []
      for (const lang of languages) {
        if (lang === 'en') {
          // English uses the main content
          if (!postData?.content?.trim()) {
            missingTranslations.push('English content')
          }
        } else {
          // Non-English languages must have translations
          const translationKey = `content_translations.${lang}`
          const translatedContent = postData?.content_translations?.[lang] || postData?.[translationKey]
          
          if (!translatedContent?.trim()) {
            const languageNames = { es: 'Spanish', hi: 'Hindi' }
            missingTranslations.push(`${languageNames[lang as keyof typeof languageNames] || lang} translation`)
          }
        }
      }

      if (missingTranslations.length > 0) {
        throw new Error(`Cannot generate audio: Missing translations for ${missingTranslations.join(', ')}. Please go back to the Translation step and complete all translations before generating audio.`)
      }

      // 🎪 The Multilingual Content Preparation - Each language gets its perfect script!
      const multilangTexts = {
        en: postData?.content || '',
        es: postData?.content_translations?.es || postData?.content || '',
        hi: postData?.content_translations?.hi || postData?.content || ''
      }

      const multilangTitles = {
        en: postData?.title || 'Untitled',
        es: postData?.title_translations?.es || postData?.title || 'Untitled',
        hi: postData?.title_translations?.hi || postData?.title || 'Untitled'
      }

      // 🎨 Additional validation for titles
      const missingTitleTranslations = []
      for (const lang of languages) {
        if (lang === 'en') {
          if (!postData?.title?.trim()) {
            missingTitleTranslations.push('English title')
          }
        } else {
          const translatedTitle = postData?.title_translations?.[lang]
          if (!translatedTitle?.trim()) {
            const languageNames = { es: 'Spanish', hi: 'Hindi' }
            missingTitleTranslations.push(`${languageNames[lang as keyof typeof languageNames] || lang} title`)
          }
        }
      }

      if (missingTitleTranslations.length > 0) {
        throw new Error(`Cannot generate audio: Missing title translations for ${missingTitleTranslations.join(', ')}. Please complete all translations in the Translation step.`)
      }

      // 🎵 Final validation that we have content for selected languages
      const missingLanguages = languages.filter(lang => !multilangTexts[lang as keyof typeof multilangTexts]?.trim())
      if (missingLanguages.length > 0) {
        throw new Error(`Missing content for languages: ${missingLanguages.join(', ')}. Please go back and ensure all translations are complete.`)
      }

      // 🎬 **THE NEW API CLIENT MAGIC**: Create audio job using our theatrical API!
      const audioJobData: Omit<AudioJobData, 'id' | 'createdAt' | 'updatedAt'> = {
        post_id: postId,
        status: 'pending',
        text_content: JSON.stringify(multilangTexts),
        input_text: postData?.content || '',
        config: {
          voice: selectedVoice,
          voice_preference: voiceGender,
          voice_settings: {
            voice_gender: voiceGender,
            personality,
            speed
          },
          title: JSON.stringify(multilangTitles)
        },
        languages: languages.length > 0 ? languages : ['en'],
        completed_languages: [],
        audio_urls: {},
        translated_texts: multilangTexts,
        language_statuses: Object.fromEntries(
          languages.map(lang => [lang, { status: 'pending', draft: isDraft }])
        ),
        current_language: languages[0] || 'en',
        is_draft: isDraft,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 🎪 Create the audio job using our magnificent API client!
      console.info('🎭 Creating audio job with our new API client...', audioJobData)
      const createdJob = await apiClient.createAudioJob(audioJobData)
      
      if (!createdJob.success || !createdJob.data) {
        throw new Error(createdJob.message || 'Failed to create audio job')
      }

      const audioJob = createdJob.data
      console.info('✅ AudioStep: Job created successfully!', { jobId: audioJob.id, audioJob })

      // 🎵 Enhanced Audio Data Structure with full job information
      const audioData: AudioData = {
        jobId: audioJob.id,
        status: audioJob.audio_urls && Object.keys(audioJob.audio_urls).length > 0 ? 'immediate' : 'processing',
        immediateUrls: audioJob.audio_urls || {},
        audioJob: audioJob // Include full job data for enhanced tracking
      }

      push({ 
        emoji: '🎶', 
        title: 'Audio job created successfully!', 
        description: `Job ID: ${audioJob.id} | Languages: ${languages.join(', ')}`, 
        type: 'success' 
      })
      
      setJobId(audioJob.id)
      onNext(audioData)
      
    } catch (e: any) {
      const errorMessage = e instanceof APIError 
        ? `API Error (${e.code}): ${e.message}`
        : e instanceof Error 
        ? e.message 
        : 'An unexpected error occurred during audio generation'
      
      setError(errorMessage)
      console.error('❌ AudioStep: Generate failed', e)
      push({ 
        emoji: '❌', 
        title: 'Audio generation failed', 
        description: errorMessage, 
        type: 'error' 
      })
    } finally {
      const duration = Date.now() - startedAt
      console.info(`⏱️ AudioStep: request duration ${duration}ms`)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Step 4: Audio Creation</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">{error}</div>
      )}

      {postData?.audioContentVersion && postData.audioContentVersion !== postData.contentVersion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ The existing audio was generated for an older version of this content. Please regenerate to keep things fresh!
        </div>
      )}

      {postData?.audioIsStale && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ Audio marked stale on server. Regeneration recommended.
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-medium text-gray-900 mb-3">TTS Provider</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="tts-provider"
              value="openai"
              checked={ttsProvider === 'openai'}
              onChange={() => setTtsProvider('openai')}
              className="mr-2"
            />
            <span className="text-sm font-medium">OpenAI TTS (Recommended)</span>
            <span className="ml-2 text-xs text-gray-500">- Matches backend defaults</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="tts-provider"
              checked={ttsProvider === 'elevenlabs'}
              onChange={() => setTtsProvider('elevenlabs')}
              className="mr-2"
            />
            <span className="text-sm font-medium">ElevenLabs (Legacy)</span>
            <span className="ml-2 text-xs text-gray-500">- Limited language support</span>
          </label>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Languages</h3>
        <div className="space-y-2">
          {['en', 'es', 'hi'].map((lang) => (
            <label key={lang} className="flex items-center">
              <input
                type="checkbox"
                checked={languages.includes(lang)}
                onChange={() => toggleLanguage(lang)}
                className="mr-2"
              />
              <span className="text-sm">
                {lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : 'Hindi'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {ttsProvider === 'openai' && (
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-medium text-gray-900 mb-3">OpenAI Voices</h3>
          <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              placeholder="Search voices..."
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <select
              value={voiceGenderFilter}
              onChange={(e) => setVoiceGenderFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <div className="text-sm text-gray-500 self-center">{filteredVoices.length} voice(s)</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(filteredVoices.length ? filteredVoices : [
              { id: 'nova', label: 'Nova', gender: 'female', tags: ['default'], languages: ['en','es','hi'] },
              { id: 'sage', label: 'Sage', gender: 'male', tags: ['calm'], languages: ['en','es','hi'] },
              { id: 'shimmer', label: 'Shimmer', gender: 'female', tags: ['expressive'], languages: ['en','es','hi'] },
              { id: 'fable', label: 'Fable', gender: 'male', tags: ['storyteller'], languages: ['en'] },
              { id: 'alloy', label: 'Alloy', gender: 'male', tags: ['neutral'], languages: ['en'] },
              { id: 'aria', label: 'Aria', gender: 'female', tags: ['warm'], languages: ['en'] },
              { id: 'ballad', label: 'Ballad', gender: 'male', tags: ['narrative'], languages: ['en'] },
              { id: 'verse', label: 'Verse', gender: 'female', tags: ['soft'], languages: ['en'] },
            ]).map((voice) => (
              <div key={voice.id} className={`border rounded-md p-3 flex items-center justify-between ${selectedVoice === voice.id ? 'border-indigo-500' : 'border-gray-200'}`}>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{voice.label}</div>
                  <div className="text-xs text-gray-500 capitalize">{voice.gender} · {voice.tags?.join(', ')}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      try {
                        setIsSampling(true)
                        const res = await fetch(`/api/ai/sample-voice?voice=${voice.id}`)
                        if (!res.ok) throw new Error('Sample failed')
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const audio = new Audio(url)
                        audio.play()
                        push({ emoji: '🔊', title: 'Sample playing', description: voice.label, type: 'info', durationMs: 2000 })
                      } catch (e) {
                        // minimal UI
                        push({ emoji: '❌', title: 'Sample failed', description: String((e as any)?.message || e), type: 'error' })
                      } finally {
                        setIsSampling(false)
                      }
                    }}
                    className="px-2 py-1 text-xs border rounded-md bg-white hover:bg-gray-50"
                    disabled={isSampling}
                  >
                    {isSampling ? 'Sampling...' : 'Sample'}
                  </button>
                  <button
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`px-2 py-1 text-xs rounded-md ${selectedVoice === voice.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {selectedVoice === voice.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Voice Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice Gender</label>
            <select
              data-testid="voice-gender"
              value={voiceGender}
              onChange={(e) => setVoiceGender(e.target.value as VoiceGender)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="female">Female (Nova)</option>
              <option value="male">Male (Fable)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
            <select
              data-testid="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value as Personality)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="hybrid">Hybrid - Mystical curator-poet (recommended)</option>
              <option value="art_dealer">Art Dealer - Professional sales-focused tone</option>
              <option value="art_instructor">Art Instructor - Educational teaching style</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the narrative voice personality for audio generation
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow</span>
              <span>{speed}x</span>
              <span>Fast</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
            <select
              data-testid="audio-mode"
              value={isDraft ? 'draft' : 'final'}
              onChange={(e) => setIsDraft(e.target.value === 'draft')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="draft">Draft - Generate for 1 language only (faster)</option>
              <option value="final">Final - Generate for all selected languages (complete)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Draft mode generates audio for the first selected language only, Final mode generates for all selected languages
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Content to Narrate</h3>
        <div className="text-sm text-gray-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
          {postData?.content || ''}
        </div>
        <p className="text-xs text-gray-500 mt-2">{(postData?.content || '').length} characters</p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={isSubmitting}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Generating...' : jobId ? 'Regenerate Audio' : 'Generate Audio'}
        </button>
      </div>
    </div>
  )
}
