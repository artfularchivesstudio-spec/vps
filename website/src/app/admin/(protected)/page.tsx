'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PublishingPipeline from '@/components/admin/PublishingPipeline'
import AnalyticsHealthDashboard from '@/components/admin/AnalyticsHealthDashboard'
import { useAdminSettings } from '@/hooks/useAdminSettings'

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalAudioAssets: number
  workflowStats: {
    inPipeline: number
    pendingReview: number
    readyToPublish: number
  }
  recentPosts: Array<{
    id: string
    title: string
    status: string
    created_at: string
    workflow_stage?: string
    languages?: string[]
    completed_languages?: string[]
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'workflow' | 'analytics'>('overview')
  const { settings, toggleWizardMode } = useAdminSettings()

  const supabase = createClient()

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching dashboard stats...')
      
      // Test database connection first
      const testResponse = await fetch('/api/test-db')
      const testResult = await testResponse.json()
      console.log('Database test result:', testResult)
      
      // Fetch post statistics with workflow information
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, title, status, created_at, workflow_stage, languages, completed_languages')
        .order('created_at', { ascending: false })
        .limit(5)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        console.error('Supabase error details:', postsError)
        
        // Set fallback data for demo purposes
        setStats({
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
          totalAudioAssets: 0,
          workflowStats: {
            inPipeline: 0,
            pendingReview: 0,
            readyToPublish: 0
          },
          recentPosts: []
        })
        
        setError(`Database connection issue: ${postsError.message}. Using fallback data.`)
        return
      }

      // Get all posts for workflow statistics
      const { data: allPosts, error: allPostsError } = await supabase
        .from('blog_posts')
        .select('workflow_stage, status')
      
      if (allPostsError) {
        console.error('Error fetching all posts:', allPostsError)
      }

      // Fetch audio assets count (with better error handling)
      let audioCount = 0
      try {
        const { count, error: audioError } = await supabase
          .from('media_assets')
          .select('*', { count: 'exact', head: true })
          .eq('file_type', 'audio')

        if (audioError) {
          console.error('Error fetching audio count:', audioError)
        } else {
          audioCount = count || 0
        }
      } catch (audioErr) {
        console.warn('Audio assets table might not exist yet:', audioErr)
      }

      const totalPosts = allPosts?.length || 0
      const publishedPosts = allPosts?.filter(p => p.status === 'published').length || 0
      const draftPosts = allPosts?.filter(p => p.status === 'draft').length || 0
      
      const workflowStats = {
        inPipeline: allPosts?.filter(p => p.workflow_stage && p.workflow_stage !== 'published').length || 0,
        pendingReview: allPosts?.filter(p => p.workflow_stage === 'review').length || 0,
        readyToPublish: allPosts?.filter(p => p.workflow_stage === 'audio').length || 0
      }

      setStats({
        totalPosts,
        publishedPosts,
        draftPosts,
        totalAudioAssets: audioCount,
        workflowStats,
        recentPosts: posts || []
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      archived: { color: 'bg-red-100 text-red-800', label: 'Archived' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getWorkflowBadge = (stage?: string) => {
    if (!stage) return null
    
    const stageConfig = {
      draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft', icon: '📝' },
      review: { color: 'bg-yellow-100 text-yellow-800', label: 'Review', icon: '👀' },
      translation: { color: 'bg-blue-100 text-blue-800', label: 'Translation', icon: '🌐' },
      audio: { color: 'bg-purple-100 text-purple-800', label: 'Audio', icon: '🎵' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published', icon: '✅' }
    }
    
    const config = stageConfig[stage as keyof typeof stageConfig] || stageConfig.draft
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color} gap-1`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    )
  }

  const getLanguageProgress = (languages?: string[], completed?: string[]) => {
    if (!languages || languages.length === 0) return null
    
    const total = languages.length
    const completedCount = completed?.length || 0
    const percentage = total > 0 ? (completedCount / total) * 100 : 0
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {completedCount}/{total} lang
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="text-sm text-red-600 hover:text-red-800 underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Artful Archives Admin</h1>
            <p className="text-gray-600">
              Manage your multilingual content creation and publishing workflow
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleWizardMode}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                settings.useWizardMode ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
              }`}
              title={`Switch to ${settings.useWizardMode ? 'Legacy' : 'Wizard'} Mode`}
            >
              {settings.useWizardMode ? '🪄 Wizard' : '📝 Legacy'}
            </button>
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveView('workflow')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'workflow' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔄 Workflow
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📈 Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Content Based on Active View */}
      {activeView === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/admin/posts/create"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 border-l-4 border-indigo-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 text-xl">✨</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Post</h3>
                  <p className="text-sm text-gray-600">
                    {settings.useWizardMode ? 'AI-powered wizard mode' : 'Traditional legacy mode'}
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/workflow"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 border-l-4 border-blue-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">🔄</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Workflow</h3>
                  <p className="text-sm text-gray-600">Publishing pipeline</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/multilingual"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 border-l-4 border-green-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">🌐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Multilingual</h3>
                  <p className="text-sm text-gray-600">Translation management</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/posts"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 border-l-4 border-purple-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">📚</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">All Posts</h3>
                  <p className="text-sm text-gray-600">View and manage content</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Enhanced Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Posts</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-2xl">📚</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.publishedPosts}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Pipeline</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.workflowStats.inPipeline}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-2xl">🔄</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Audio Files</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalAudioAssets}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-2xl">🎵</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeView === 'workflow' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <PublishingPipeline />
        </motion.div>
      )}

      {activeView === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <AnalyticsHealthDashboard />
        </motion.div>
      )}

      {/* Recent Posts - Only show in overview */}
      {activeView === 'overview' && stats && stats.recentPosts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Posts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                      {getLanguageProgress(post.languages, post.completed_languages)}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {getWorkflowBadge(post.workflow_stage)}
                    {getStatusBadge(post.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              href="/admin/posts"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
            >
              View all posts →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
