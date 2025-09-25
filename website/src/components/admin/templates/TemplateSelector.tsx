'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { contentTemplates, getTemplatesByCategory, getTemplateCategories } from '@/data/content-templates'
import { ContentTemplate } from '@/types/templates'

interface TemplateSelectorProps {
  onTemplateSelect: (template: ContentTemplate) => void
  onSkipTemplate: () => void
}

export default function TemplateSelector({ onTemplateSelect, onSkipTemplate }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📋' },
    { id: 'art-critique', name: 'Art Critique', icon: '🎨' },
    { id: 'exhibition', name: 'Exhibitions', icon: '🏛️' },
    { id: 'artist-feature', name: 'Artist Features', icon: '🎭' },
    { id: 'educational', name: 'Educational', icon: '📚' },
    { id: 'news-update', name: 'News & Updates', icon: '📰' }
  ]

  const filteredTemplates = contentTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose a Content Template</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Start with a professional template designed for art content creation, or create from scratch
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Skip Template Button */}
          <button
            onClick={onSkipTemplate}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Start from Scratch
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onTemplateSelect(template)}
          >
            {/* Template Preview */}
            <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
              <span className="text-4xl">{template.icon}</span>
            </div>

            {/* Template Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {template.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.metadata.difficulty_level)}`}>
                  {template.metadata.difficulty_level}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {template.description}
              </p>

              {/* Template Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    ⏱️ {template.metadata.estimated_time}m
                  </span>
                  <span className="flex items-center gap-1">
                    📝 {template.structure.length} sections
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.metadata.seo_optimized && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    SEO Ready
                  </span>
                )}
                {template.metadata.social_media_ready && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Social Ready
                  </span>
                )}
              </div>

              {/* Use Template Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTemplateSelect(template)
                }}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Use This Template
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or category filters
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
            }}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Template Count */}
      <div className="text-center mt-8 text-sm text-gray-500">
        Showing {filteredTemplates.length} of {contentTemplates.length} templates
      </div>
    </div>
  )
}