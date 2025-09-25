'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface AnalyticsData {
  totalPosts: number
  publishedPosts: number
  workflowStages: {
    draft: number
    review: number
    translation: number
    audio: number
    published: number
  }
  translationStats: {
    totalTranslations: number
    successRate: number
    languageBreakdown: Record<string, number>
  }
  audioStats: {
    totalAudioFiles: number
    successRate: number
    averageProcessingTime: number
  }
  systemHealth: {
    uptime: number
    errorRate: number
    performanceScore: number
  }
}

interface AnalyticsHealthDashboardProps {
  className?: string
}

export default function AnalyticsHealthDashboard({ className }: AnalyticsHealthDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'translation' | 'audio' | 'system'>('overview')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')

  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration
      const mockAnalytics: AnalyticsData = {
        totalPosts: 156,
        publishedPosts: 89,
        workflowStages: {
          draft: 34,
          review: 18,
          translation: 12,
          audio: 8,
          published: 89
        },
        translationStats: {
          totalTranslations: 267,
          successRate: 94.2,
          languageBreakdown: {
            'en': 89,
            'es': 85,
            'hi': 73,
            'fr': 20
          }
        },
        audioStats: {
          totalAudioFiles: 198,
          successRate: 97.5,
          averageProcessingTime: 45
        },
        systemHealth: {
          uptime: 99.8,
          errorRate: 0.2,
          performanceScore: 95
        }
      }

      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (value: number, reversed = false) => {
    if (reversed) {
      return value < 1 ? 'text-green-600' : value < 5 ? 'text-yellow-600' : 'text-red-600'
    }
    return value >= 95 ? 'text-green-600' : value >= 80 ? 'text-yellow-600' : 'text-red-600'
  }

  const getHealthBgColor = (value: number, reversed = false) => {
    if (reversed) {
      return value < 1 ? 'bg-green-50' : value < 5 ? 'bg-yellow-50' : 'bg-red-50'
    }
    return value >= 95 ? 'bg-green-50' : value >= 80 ? 'bg-yellow-50' : 'bg-red-50'
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Analytics & Health Monitoring</h2>
            <p className="text-sm text-gray-600 mt-1">
              System performance and content insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'content', label: 'Content', icon: '📝' },
            { id: 'translation', label: 'Translation', icon: '🌐' },
            { id: 'audio', label: 'Audio', icon: '🎵' },
            { id: 'system', label: 'System Health', icon: '⚡' }
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
          {activeTab === 'overview' && analytics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">📝</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900">Total Posts</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.totalPosts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🚀</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900">Published</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.publishedPosts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🎵</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900">Audio Files</p>
                      <p className="text-2xl font-bold text-purple-600">{analytics.audioStats.totalAudioFiles}</p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-6 ${getHealthBgColor(analytics.systemHealth.uptime)}`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        analytics.systemHealth.uptime >= 99 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                        <span className="text-white text-sm">⚡</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">System Uptime</p>
                      <p className={`text-2xl font-bold ${getHealthColor(analytics.systemHealth.uptime)}`}>
                        {analytics.systemHealth.uptime}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Distribution */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.workflowStages).map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          stage === 'published' ? 'bg-green-500' :
                          stage === 'audio' ? 'bg-purple-500' :
                          stage === 'translation' ? 'bg-blue-500' :
                          stage === 'review' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">{stage}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && analytics && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`rounded-lg p-6 ${getHealthBgColor(analytics.systemHealth.uptime)}`}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">System Uptime</h3>
                  <p className={`text-3xl font-bold ${getHealthColor(analytics.systemHealth.uptime)}`}>
                    {analytics.systemHealth.uptime}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {analytics.systemHealth.uptime >= 99.5 ? 'Excellent' : 
                     analytics.systemHealth.uptime >= 99 ? 'Good' : 'Needs Attention'}
                  </p>
                </div>

                <div className={`rounded-lg p-6 ${getHealthBgColor(analytics.systemHealth.errorRate, true)}`}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Rate</h3>
                  <p className={`text-3xl font-bold ${getHealthColor(analytics.systemHealth.errorRate, true)}`}>
                    {analytics.systemHealth.errorRate}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {analytics.systemHealth.errorRate < 1 ? 'Excellent' : 
                     analytics.systemHealth.errorRate < 5 ? 'Good' : 'Needs Attention'}
                  </p>
                </div>

                <div className={`rounded-lg p-6 ${getHealthBgColor(analytics.systemHealth.performanceScore)}`}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Score</h3>
                  <p className={`text-3xl font-bold ${getHealthColor(analytics.systemHealth.performanceScore)}`}>
                    {analytics.systemHealth.performanceScore}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {analytics.systemHealth.performanceScore >= 90 ? 'Excellent' : 
                     analytics.systemHealth.performanceScore >= 80 ? 'Good' : 'Needs Attention'}
                  </p>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Database Connection</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Storage Service</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Audio Processing</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠ Degraded
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Translation Service</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Healthy
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}