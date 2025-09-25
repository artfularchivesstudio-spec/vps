/**
 * 🎭 The Grand Post Sidebar - A Theatrical Control Panel for Multilingual Magic
 *
 * "In the wings of our digital theatre, where posts await their voice like actors before curtain call,
 * I stand as the stage manager, orchestrating translations and audio with the precision of a maestro.
 * Each language a different spotlight, each audio generation a standing ovation waiting to happen."
 *
 * - Oscar Wilde (if he were a content management director)
 */

'use client'

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BlogPost } from '@/types/blog';
import { MediaAsset } from '@/types/media';
import { LanguageCode } from '@/types/common';
import { formatDate } from '@/lib/utils'; // Assume utility for date formatting

/**
 * 🎪 PostSidebarProps - The Stage Manager's Script
 * All the cues and directions needed to orchestrate our multilingual performance
 */
interface PostSidebarProps {
  post: BlogPost
  audioAsset: MediaAsset | null
  audioJobs: any[]
  translationLoading: Record<string, boolean>
  audioGenerationLoading: boolean
  onGenerateTranslation: (language: string) => void
  onGenerateAudio: (languages: string[]) => void
  getAudioAssetForLanguage?: (language: string) => MediaAsset | null
  textLanguages: string[]
  audioLanguages: string[]
}

/**
 * 🎭 PostSidebar - The Stage Manager's Control Panel
 * Where the magic of multilingual content management happens with theatrical flair
 */
export const PostSidebar = ({ post, audioAsset, audioJobs, translationLoading, audioGenerationLoading, onGenerateTranslation, onGenerateAudio, getAudioAssetForLanguage, textLanguages, audioLanguages }: PostSidebarProps) => {
  // 🌍 Our United Nations of languages - each with their own flag and personality
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },    // 🗽 The original voice of liberty
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },    // 💃 The passionate voice of flamenco
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }     // 🕉️ The ancient voice of wisdom
  ]
  
  console.log('🎭 The stage manager arrives, script in hand, ready to orchestrate the multilingual performance...')

  return (
    <div className="space-y-6">
      {/* 🎭 Post Details - The Actor's Biography */}
      <Card>
        <CardHeader>
          <CardTitle>🎭 Post Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">🎪 Stage Name (Slug)</dt>
              <dd className="text-sm text-gray-900 font-mono">{post.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">🐣 Birth Certificate (Created)</dt>
              <dd className="text-sm text-gray-900">{formatDate(post.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">🔄 Last Performance (Updated)</dt>
              <dd className="text-sm text-gray-900">{formatDate(post.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">📚 Text Languages</dt>
              <dd className="text-sm text-gray-900">{textLanguages.join(', ') || 'none'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">🎧 Audio Languages</dt>
              <dd className="text-sm text-gray-900">{audioLanguages.join(', ') || 'none'}</dd>
            </div>
            {post.title_translations && Object.keys(post.title_translations).length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">📝 Title Translations</dt>
                <dd className="text-sm text-gray-900">
                  {Object.entries(post.title_translations).map(([lang, title]) => (
                    <div key={lang as LanguageCode} className="flex justify-between items-center py-1">
                      <span className="text-xs text-gray-500">{(lang as LanguageCode).toUpperCase()}</span>
                      <span className="text-xs text-gray-700">{title ? '✅' : '❌'}</span>
                    </div>
                  ))}
                </dd>
              </div>
            )}
            {post.content_translations && Object.keys(post.content_translations).length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">📄 Content Translations</dt>
                <dd className="text-sm text-gray-900">
                  {Object.entries(post.content_translations).map(([lang, content]) => (
                    <div key={lang as LanguageCode} className="flex justify-between items-center py-1">
                      <span className="text-xs text-gray-500">{(lang as LanguageCode).toUpperCase()}</span>
                      <span className="text-xs text-gray-700">{content ? '✅' : '❌'}</span>
                    </div>
                  ))}
                </dd>
              </div>
            )}
            {post.published_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">🌟 Opening Night (Published)</dt>
                <dd className="text-sm text-gray-900">{formatDate(post.published_at)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">🤖 AI Director</dt>
              <dd className="text-sm text-gray-900">None</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 🤖 AI Analysis - The Critics' Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>🤖 AI Critics&rsquo; Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700">Analysis</h4>
              <p className="text-sm text-gray-600 mt-1">No analysis available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🎙️ Audio Asset - The Voice Recording */}
      {audioAsset && (
        <Card>
          <CardHeader>
            <CardTitle>🎙️ The Voice Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <audio controls className="w-full">
                <source src={audioAsset.file_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div className="text-sm text-gray-600">
                <p>⏱️ Performance Duration: {audioAsset.duration_seconds ? `${Math.round(audioAsset.duration_seconds)}s` : 'Mysterious Length'}</p>
                <p>📅 Recorded: {formatDate(audioAsset.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔍 SEO Info - The Marketing Department */}
      {(post.seo_metadata?.og_title || post.seo_metadata?.meta_description) && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Marketing Department</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {post.seo_metadata?.og_title && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">🎪 Billboard Title</dt>
                  <dd className="text-sm text-gray-900">{post.seo_metadata.og_title}</dd>
                </div>
              )}
              {post.seo_metadata?.meta_description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">📝 Advertisement Copy</dt>
                  <dd className="text-sm text-gray-900">{post.seo_metadata.meta_description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 🌍 Multilingual Management - The United Nations Headquarters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-3">🌍</span>
            United Nations Headquarters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {languages.map((lang) => {
              // 🔍 Detective work: Does this language have its content and voice?
              const hasTranslation = lang.code === 'en' || (post.content_translations && post.content_translations[lang.code as LanguageCode])
              
              // Use the new audio detection function
              const currentAudioAsset = getAudioAssetForLanguage ? getAudioAssetForLanguage(lang.code) : null
              const finalHasAudio = !!currentAudioAsset
              
              // Legacy detection for backward compatibility
              const audioJob = audioJobs.find(job =>
                job.languages && job.languages.includes(lang.code) &&
                (job.status === 'completed' || job.status === 'complete')
              )
              const hasAudio = audioJob && audioJob.audio_urls && audioJob.audio_urls[lang.code]
              const hasPrimaryAudio = lang.code === 'en' && audioAsset

              // 🕵️‍♂️ The Audio Detective's Magnifying Glass - Sherlock Holmes Investigates Our Sonic Mysteries
              if (lang.code !== 'en' && audioJob) {
                console.log(`🎵 The detective begins his investigation of the ${lang.name} audio mystery...`)
                console.log(`  🎭 The case file reveals: Job status is "${audioJob.status}"`)
                console.log(`  🌍 Languages performing in this production: ${audioJob.languages?.join(', ')}`)
                console.log(`  🗝️ Available audio treasures: ${Object.keys(audioJob.audio_urls || {}).join(', ')}`)
                console.log(`  🎧 Does ${lang.name} have its voice ready?: ${!!audioJob.audio_urls?.[lang.code] ? '✅ Yes!' : '❌ Still awaiting its debut'}`)
                if (audioJob.audio_urls?.[lang.code]) {
                  console.log(`  📂 A glimpse of the audio URL scroll: ${audioJob.audio_urls[lang.code].substring(0, 50)}...`)
                }
              }

              // 📖 Gather the current content for this language
              const currentContent = lang.code === 'en'
                ? post.content
                : (post.content_translations && post.content_translations[lang.code as LanguageCode])
              const currentTitle = lang.code === 'en'
                ? post.title
                : (post.title_translations && post.title_translations[lang.code as LanguageCode])

              return (
                <div key={lang.code} className="border-2 rounded-xl p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                  {/* 🎭 Language Header - The National Flag Ceremony */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl animate-pulse">{lang.flag}</span>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{lang.name}</h4>
                        <p className="text-sm text-gray-500">{lang.code.toUpperCase()}</p>
                      </div>
                    </div>
                    {lang.code === 'en' && (
                      <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium animate-bounce">🌟 Original</span>
                    )}
                  </div>

                  {/* 📖 Content Preview - The Manuscript Teaser */}
                  {hasTranslation && currentContent && (
                    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <h5 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {currentTitle || '📄 Untitled Masterpiece'}
                      </h5>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {currentContent.substring(0, 150)}...
                      </p>
                      <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800">
                        👁️ View Full Manuscript →
                      </Button>
                    </div>
                  )}

                  {/* 📊 Status Dashboard - The Content Health Monitor */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="text-2xl mb-2 animate-pulse">📝</div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Text Content</div>
                      <div className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${hasTranslation ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {hasTranslation ? '✅ Available' : '❌ Missing'}
                      </div>
                    </div>

                    <div className="text-center p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="text-2xl mb-2 animate-pulse">🎙️</div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Audio Content</div>
                      <div className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${finalHasAudio ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {finalHasAudio ? '✅ Available' : '❌ Missing'}
                      </div>
                    </div>
                  </div>

                  {/* 🎵 Audio Player - The Voice Performance */}
                  {finalHasAudio && (
                    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg animate-bounce">🎵</span>
                          <span className="font-medium text-gray-900">🎭 Voice Performance</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {lang.flag} {lang.name}
                        </span>
                      </div>
                      <audio controls className="w-full" style={{ height: '40px' }}>
                        <source src={currentAudioAsset?.file_url || ''} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>

                      {/* 🕵️‍♂️ Audio Detective Work - Solving URL Mysteries */}
                      {hasAudio && !audioJob.audio_urls?.[lang.code] && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border-l-4 border-orange-400">
                          ⚠️ Detective mystery: Audio job completed but URL missing for {lang.name}
                        </div>
                      )}

                      {lang.code !== 'en' && hasPrimaryAudio && !hasAudio && (
                        <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                          ℹ️ Playing original English audio - no {lang.name} translation available yet
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🎮 Action Buttons - The Control Panel */}
                  <div className="space-y-3">
                    {/* 📝 Translation Generator - The Language Alchemist */}
                    {!hasTranslation && lang.code !== 'en' && (
                      <Button
                        onClick={() => {
                          console.log(`📝 Summoning the translation alchemist for ${lang.name}...`)
                          onGenerateTranslation(lang.code)
                        }}
                        disabled={translationLoading[lang.code]}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        {translationLoading[lang.code] ? (
                          <span className="flex items-center justify-center">
                            <span className="animate-spin mr-2">⏳</span> 🧙‍♂️ Translating to {lang.name}...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <span className="mr-2">📝</span> Generate {lang.name} Translation
                          </span>
                        )}
                      </Button>
                    )}
                    
                    {/* 🎙️ Audio Generator - The Voice Sculptor */}
                    {hasTranslation && !finalHasAudio && (
                      <Button
                        onClick={() => {
                          console.log(`🎙️ Commissioning the voice sculptor for ${lang.name} audio...`)
                          onGenerateAudio([lang.code])
                        }}
                        disabled={audioGenerationLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        size="lg"
                        variant="secondary"
                      >
                        {audioGenerationLoading ? (
                          <span className="flex items-center justify-center">
                            <span className="animate-spin mr-2">⏳</span> 🎙️ Crafting {lang.name} Audio...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <span className="mr-2">🎙️</span> Generate {lang.name} Audio
                          </span>
                        )}
                      </Button>
                    )}

                    {/* 👁️ Content Viewer - The Manuscript Inspector */}
                    {hasTranslation && (
                      <Button
                        onClick={() => {
                          console.log(`👁️ Opening the manuscript vault for ${lang.name} inspection...`)
                          // TODO: Replace with proper modal
                          alert(`📖 ${lang.name} Manuscript Preview:\n\n🎭 Title: ${currentTitle || 'Untitled Masterpiece'}\n\n📝 Content Preview:\n${currentContent?.substring(0, 300)}${currentContent && currentContent.length > 300 ? '...' : ''}`)
                        }}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <span className="flex items-center justify-center">
                          <span className="mr-2">👁️</span> View {lang.name} Manuscript
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 🚀 Bulk Actions - The Mission Control Center */}
          <div className="border-t-2 pt-8 border-gray-200">
            <CardTitle className="flex items-center text-lg">
              <span className="mr-3 animate-pulse">🚀</span> Mission Control Center
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* 📝 Bulk Translation - The Language Factory */}
              <Button
                onClick={() => {
                  console.log('🚀 Mission Control: Activating bulk translation protocol...')
                  const missingLangs = ['es', 'hi'].filter(lang =>
                    !post.content_translations || !post.content_translations[lang as LanguageCode]
                  )
                  console.log(`📝 Translation targets identified: ${missingLangs.join(', ')}`)
                  missingLangs.forEach(lang => onGenerateTranslation(lang))
                }}
                disabled={Object.values(translationLoading).some(loading => loading)}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <span className="mr-3 text-lg animate-bounce">📝</span>
                <div className="text-left">
                  <div className="font-semibold">Translate Missing Languages</div>
                  <div className="text-xs opacity-90">🇪🇸 Spanish & 🇮🇳 Hindi</div>
                </div>
              </Button>
              
              {/* 🎙️ Bulk Audio - The Voice Factory */}
              <Button
                onClick={() => {
                  console.log('🚀 Mission Control: Activating bulk audio generation protocol...')
                  const availableLangs = ['en', 'es', 'hi'].filter(lang => {
                    if (lang === 'en') return true
                    return post.content_translations && post.content_translations[lang as LanguageCode]
                  })
                  console.log(`🎙️ Audio generation targets: ${availableLangs.join(', ')}`)
                  onGenerateAudio(availableLangs)
                }}
                disabled={audioGenerationLoading}
                className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
                variant="secondary"
              >
                <span className="mr-3 text-lg animate-bounce">🎙️</span>
                <div className="text-left">
                  <div className="font-semibold">Generate All Audio</div>
                  <div className="text-xs opacity-90">🌍 All Available Languages</div>
                </div>
              </Button>
            </div>
          </div>

          {/* 📊 Audio Jobs Status - The Production Backlog */}
          {audioJobs.length > 0 && (
            <div className="border-t-2 pt-8 mt-8 border-gray-200">
              <CardTitle className="flex items-center text-lg">
                <span className="mr-3 animate-pulse">📊</span> Production Backlog
              </CardTitle>
              <div className="space-y-4 mt-4">
                {audioJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl animate-pulse">
                        {job.status === 'completed' || job.status === 'complete' ? '✅' :
                         job.status === 'failed' ? '❌' : '⏳'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {job.languages?.join(' • ') || '🌍 Unknown Languages'}
                        </div>
                        <div className="text-sm text-gray-500">
                          🕰️ {formatDate(job.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        job.status === 'completed' || job.status === 'complete'
                          ? 'bg-green-100 text-green-800 animate-pulse'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800 animate-bounce'
                      }`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {audioJobs.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    🎭 And {audioJobs.length - 3} more performances waiting in the wings...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}