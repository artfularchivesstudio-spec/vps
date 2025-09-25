'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PublishingPipeline from '@/components/admin/PublishingPipeline'
import MultilingualDashboard from '@/components/admin/MultilingualDashboard'
import AudioControlCenter from '@/components/admin/AudioControlCenter'
import AnalyticsHealthDashboard from '@/components/admin/AnalyticsHealthDashboard'

type WorkflowTab = 'pipeline' | 'multilingual' | 'audio' | 'analytics'

export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState<WorkflowTab>('pipeline')

  const tabs = [
    { id: 'pipeline', label: 'Publishing Pipeline', icon: '🔄', description: 'Manage content workflow from draft to publication' },
    { id: 'multilingual', label: 'Multilingual', icon: '🌐', description: 'Translation management and language-specific controls' },
    { id: 'audio', label: 'Audio Center', icon: '🎵', description: 'Audio generation and voice control management' },
    { id: 'analytics', label: 'Analytics', icon: '📊', description: 'Performance tracking and system health monitoring' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Management</h1>
          <p className="text-gray-600">
            Comprehensive workflow management for multilingual content publishing
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as WorkflowTab)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'pipeline' && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PublishingPipeline />
            </motion.div>
          )}

          {activeTab === 'multilingual' && (
            <motion.div
              key="multilingual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 gap-6">
                <MultilingualDashboard />
              </div>
            </motion.div>
          )}

          {activeTab === 'audio' && (
            <motion.div
              key="audio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AudioControlCenter />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalyticsHealthDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}