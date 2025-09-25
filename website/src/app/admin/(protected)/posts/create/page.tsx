'use client'

import { useState } from 'react'
import CreatePostWizard from '@/components/admin/CreatePostWizard'
import LegacyCreatePost from '@/components/admin/LegacyCreatePost'
import TemplateSelector from '@/components/admin/templates/TemplateSelector'
import TemplateEditor from '@/components/admin/templates/TemplateEditor'
import { useAdminSettings } from '@/hooks/useAdminSettings'
import { ContentTemplate, TemplateInstance } from '@/types/templates'

type CreateMode = 'template-select' | 'template-editor' | 'wizard' | 'legacy'

export default function CreatePost() {
  const { settings, isLoading, toggleWizardMode } = useAdminSettings()
  const [mode, setMode] = useState<CreateMode>('wizard') // Default to wizard for simple flow
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null)

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template)
    setMode('template-editor')
  }

  const handleSkipTemplate = () => {
    setMode('wizard')
  }

  const handleTemplateBack = () => {
    setMode('template-select')
    setSelectedTemplate(null)
  }

  const handleTemplateSave = async (instance: TemplateInstance) => {
    console.log('Saving template instance:', instance)
    // Here you would save to your database
    // For now, just redirect to the posts list
    window.location.href = '/admin/posts'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Template Selection Flow
  if (mode === 'template-select') {
    return (
      <TemplateSelector 
        onTemplateSelect={handleTemplateSelect}
        onSkipTemplate={handleSkipTemplate}
      />
    )
  }

  // Template Editor Flow
  if (mode === 'template-editor' && selectedTemplate) {
    return (
      <TemplateEditor
        template={selectedTemplate}
        onSave={handleTemplateSave}
        onBack={handleTemplateBack}
      />
    )
  }

  // Original Wizard/Legacy Flow
  return (
    <div className="relative">
      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 max-w-fit ml-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('template-select')}
              className="px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
              title="Back to Templates"
            >
              📋 Templates
            </button>
            <span className="text-sm font-medium text-gray-700">
              Wizard Mode
            </span>
          </div>
        </div>
      </div>

      {/* Render Wizard */}
      <CreatePostWizard />
    </div>
  )
}