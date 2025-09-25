'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BlogPost } from '@/types/blog';
import { LanguageCode } from '@/types/common';

interface Language {
  code: string
  name: string
  flag: string
  enabled: boolean
}

interface TranslationJob {
  id: string
  post_id: string
  target_language: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error_message?: string
  created_at: string 
  updated_at: string
}

interface LanguageStats {
  language: string;
  posts: number;
  audio: number;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', enabled: true },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', enabled: true },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', enabled: true },
  { code: 'fr', name: 'French', flag: '🇫🇷', enabled: false },
  { code: 'de', name: 'German', flag: '🇩🇪', enabled: false },
  { code: 'it', name: 'Italian', flag: '🇮🇹', enabled: false },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', enabled: false },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', enabled: false },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', enabled: false },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', enabled: false },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', enabled: false },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', enabled: false }
]

interface MultilingualDashboardProps {
  className?: string
}

export default function MultilingualDashboard({ className }: MultilingualDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'translations' | 'settings'>('overview')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [translationJobs, setTranslationJobs] = useState<TranslationJob[]>([])
  const [languages, setLanguages] = useState<Language[]>(SUPPORTED_LANGUAGES)
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [showTranslationModal, setShowTranslationModal] = useState(false)
  const [translationProgress, setTranslationProgress] = useState<Record<string, number>>({})
  const [audioGeneration, setAudioGeneration] = useState<Record<string, number>>({})

  const handleBulkTranslate = () => {
    if (!selectedPost) return;
    
    // Get selected languages from the modal
    const selectedLanguages = languages.filter(lang => lang.enabled && lang.code !== 'en');
    
    // Start translation for each selected language
    selectedLanguages.forEach(lang => {
      startTranslation(selectedPost, lang.code);
    });
    
    setShowTranslationModal(false);
  };

  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchTranslationJobs = useCallback(async () => {
    try {
      // Mock translation jobs for now - in real implementation, this would be a separate table
      const mockJobs: TranslationJob[] = [
        {
          id: '1',
          post_id: 'post-1',
          target_language: 'es',
          status: 'completed',
          progress: 100,
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:05:00Z'
        },
        {
          id: '2',
          post_id: 'post-2',
          target_language: 'hi',
          status: 'processing',
          progress: 65,
          created_at: '2025-01-15T11:00:00Z',
          updated_at: '2025-01-15T11:03:00Z'
        }
      ]
      setTranslationJobs(mockJobs)
    } catch (error) {
      console.error('Error fetching translation jobs:', error)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
    fetchTranslationJobs()
  }, [fetchPosts, fetchTranslationJobs])

  const getTranslationStatus = (post: BlogPost, languageCode: string) => {
    if (languageCode === 'en') {
      if (post.title && post.content) return 'complete';
      return 'missing';
    }
    
    const hasTitle = post.title_translations && post.title_translations[languageCode as LanguageCode];
    const hasContent = post.content_translations && post.content_translations[languageCode as LanguageCode];
    
    if (hasTitle && hasContent) return 'complete';
    if (hasTitle || hasContent) return 'partial';
    return 'missing';
  };

  const getTranslationStats = () => {
    const stats = languages.reduce((acc, lang) => {
      acc[lang.code] = {
        total: posts.length,
        completed: 0,
        partial: 0,
        missing: 0
      }
      return acc
    }, {} as Record<string, any>)

    posts.forEach(post => {
      languages.forEach(lang => {
        const status = getTranslationStatus(post, lang.code)
        if (status === 'complete') {
          stats[lang.code].completed++;
        }
        else if (status === 'partial') {
          stats[lang.code].partial++;
        } else if (status === 'missing') {
          stats[lang.code].missing++;
        }
      })
    })

    return stats
  }

  const startTranslation = async (post: BlogPost, targetLanguage: string) => {
    try {
      // Mock translation process - in real implementation, this would call a translation API
      setTranslationProgress(prev => ({ ...prev, [targetLanguage]: 0 }))
      
      // Simulate translation progress
      const interval = setInterval(() => {
        setTranslationProgress(prev => {
          const currentProgress = prev[targetLanguage] || 0
          const newProgress = Math.min(currentProgress + 10, 100)
          
          if (newProgress === 100) {
            clearInterval(interval)
            // Update the post with mock translation
            setPosts(prevPosts =>
              prevPosts.map(p =>
                p.id === post.id
                  ? {
                      ...p,
                      title_translations: {
                        ...p.title_translations,
                        [targetLanguage]: `[${targetLanguage.toUpperCase()}] ${p.title}`
                      },
                      content_translations: {
                        ...p.content_translations,
                        [targetLanguage]: `[${targetLanguage.toUpperCase()}] ${p.content}`
                      },
                      excerpt_translations: {
                        ...p.excerpt_translations,
                        [targetLanguage]: `[${targetLanguage.toUpperCase()}] Excerpt`
                      }
                    }
                  : p
              )
            )
          }
          
          return { ...prev, [targetLanguage]: newProgress }
        })
      }, 500)
    } catch (error) {
      console.error('Error starting translation:', error)
    }
  }

  const startAudioGeneration = async (post: BlogPost, targetLanguage: string) => {
    try {
      // Mock audio generation process - in real implementation, this would call an audio generation API
      setAudioGeneration(prev => ({ ...prev, [targetLanguage]: 0 }))
      
      // Simulate audio generation progress
      const interval = setInterval(() => {
        setAudioGeneration(prev => {
          const currentProgress = prev[targetLanguage] || 0
          const newProgress = Math.min(currentProgress + 10, 100)
          
          if (newProgress === 100) {
            clearInterval(interval)
            // In a real implementation, this would save the generated audio file
            console.log(`Audio generated for ${targetLanguage}`)
          }
          
          return { ...prev, [targetLanguage]: newProgress }
        })
      }, 500)
    } catch (error) {
      console.error('Error generating audio:', error)
    }
  }

  const stats = getTranslationStats()

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Multilingual Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage translations and multilingual content for your blog posts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'translations', label: 'Translations', icon: '🌐' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
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
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Language Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {languages.filter(lang => lang.enabled).map(lang => (
                  <div key={lang.code} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium text-gray-900">{lang.name}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Complete:</span>
                        <span className="font-medium text-green-600">
                          {stats[lang.code]?.completed || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Partial:</span>
                        <span className="font-medium text-yellow-600">
                          {stats[lang.code]?.partial || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Missing:</span>
                        <span className="font-medium text-red-600">
                          {stats[lang.code]?.missing || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Translation Jobs */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Recent Translation Jobs</h3>
                <div className="space-y-2">
                  {translationJobs.slice(0, 5).map(job => (
                    <div key={job.id} className="flex items-center justify-between bg-white rounded p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          job.status === 'completed' ? 'bg-green-500' :
                          job.status === 'processing' ? 'bg-yellow-500' :
                          job.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium">
                          {languages.find(l => l.code === job.target_language)?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{job.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'translations' && (
            <motion.div
              key="translations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Posts Translation Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Content Translations</h3>
                  <button
                    onClick={() => console.log('Bulk translate coming soon')}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Bulk Translate (Coming Soon)
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900">Post</th>
                        {languages.filter(lang => lang.enabled).map(lang => (
                          <th key={lang.code} className="text-center p-4 font-medium text-gray-900">
                            <div className="flex items-center justify-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.code.toUpperCase()}</span>
                            </div>
                          </th>
                        ))}
                        <th className="text-right p-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {posts.slice(0, 10).map(post => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <div className="max-w-xs">
                              <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          {languages.filter(lang => lang.enabled).map(lang => (
                            <td key={lang.code} className="text-center p-4">
                              <TranslationStatusBadge 
                                status={getTranslationStatus(post, lang.code)}
                                progress={translationProgress[lang.code]}
                              />
                            </td>
                          ))}
                          <td className="text-right p-4">
                            <button
                              onClick={() => {
                                setSelectedPost(post)
                                setShowTranslationModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Translate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Language Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {languages.map(lang => (
                      <div key={lang.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{lang.name}</h4>
                            <p className="text-sm text-gray-500">{lang.code}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lang.enabled}
                            onChange={(e) => {
                              setLanguages(prev => 
                                prev.map(l => 
                                  l.code === lang.code 
                                    ? { ...l, enabled: e.target.checked }
                                    : l
                                )
                              )
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Translation Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-translate new posts
                      </label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="disabled">Disabled</option>
                        <option value="enabled">Enabled for all languages</option>
                        <option value="selective">Enabled for selected languages</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translation Provider
                      </label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="openai">OpenAI GPT-4</option>
                        <option value="google">Google Translate</option>
                        <option value="azure">Azure Translator</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Translation Modal */}
      <AnimatePresence>
        {showTranslationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Translate Content
              </h3>
              
              {selectedPost && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Post:</p>
                  <p className="font-medium text-gray-900">{selectedPost.title}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Select target languages:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {languages.filter(lang => lang.enabled && lang.code !== 'en').map(lang => (
                    <label key={lang.code} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTranslationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedPost) {
                      languages.filter(lang => lang.enabled && lang.code !== 'en').forEach(lang => {
                        startTranslation(selectedPost, lang.code)
                        startAudioGeneration(selectedPost, lang.code)
                      })
                    }
                    setShowTranslationModal(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Translation & Audio Generation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper component for translation status badges
interface TranslationStatusBadgeProps {
  status: 'original' | 'complete' | 'partial' | 'missing'
  progress?: number
}

function TranslationStatusBadge({ status, translationProgress, audioGenerationProgress }: TranslationStatusBadgeProps) {
  // Show translation progress if available
  if (typeof translationProgress === 'number' && translationProgress < 100) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="text-xs text-yellow-600">{translationProgress}%</span>
      </div>
    )
  }
  
  // Show audio generation progress if available
  if (typeof audioGenerationProgress === 'number' && audioGenerationProgress < 100) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-600">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <span className="text-xs text-purple-600">{audioGenerationProgress}%</span>
      </div>
    )
  }
  
  const config = {
    original: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Original' },
    complete: { bg: 'bg-green-100', text: 'text-green-800', label: 'Complete' },
    partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial' },
    missing: { bg: 'bg-red-100', text: 'text-red-800', label: 'Missing' }
  }
  
  const { bg, text, label } = config[status]
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

interface TranslationStatusBadgeProps {
  status: 'original' | 'complete' | 'partial' | 'missing'
  translationProgress?: number
  audioGenerationProgress?: number
}
