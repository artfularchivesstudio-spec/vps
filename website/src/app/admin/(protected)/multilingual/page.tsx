'use client'


import AudioControlCenter from '@/components/admin/AudioControlCenter'
import MultilingualDashboard from '@/components/admin/MultilingualDashboard'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function MultilingualPage() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'audio'>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Multilingual Content Management</h1>
          <p className="text-gray-600 mt-1">
            Manage translations, audio generation, and multilingual content workflows
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>🌐</span>
              Translation Dashboard
            </button>
            <button
              onClick={() => setActiveSection('audio')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'audio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>🎵</span>
              Audio Control Center
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'dashboard' && (
            <MultilingualDashboard className="mb-8" />
          )}
          
          {activeSection === 'audio' && (
            <AudioControlCenter className="mb-8" />
          )}
        </motion.div>
      </div>
    </div>
  )
}