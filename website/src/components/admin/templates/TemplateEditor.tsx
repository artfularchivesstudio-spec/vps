'use client'

import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'
import { ContentTemplate, SectionContent, TemplateInstance, TemplateSection } from '@/types/templates'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface TemplateEditorProps {
  template: ContentTemplate
  onSave: (instance: TemplateInstance) => void
  onBack: () => void
  initialData?: TemplateInstance
}

export default function TemplateEditor({ template, onSave, onBack, initialData }: TemplateEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [sectionContent, setSectionContent] = useState<Record<string, SectionContent>>({})
  const [currentSection, setCurrentSection] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const { push } = useToast()

  useEffect(() => {
    // Initialize section content from initial data or empty
    const initialContent: Record<string, SectionContent> = {}
    template.structure.forEach(section => {
      const existingContent = initialData?.content.find(c => c.section_id === section.id)
      initialContent[section.id] = existingContent || {
        section_id: section.id,
        content: '',
        ai_generated: false,
        reviewed: false
      }
    })
    setSectionContent(initialContent)
  }, [template, initialData])

  const updateSectionContent = (sectionId: string, content: any, aiGenerated: boolean = false) => {
    setSectionContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        content,
        ai_generated: aiGenerated,
        reviewed: false
      }
    }))
  }

  const generateAIContent = async (section: TemplateSection) => {
    if (!section.ai_prompt) return

    try {
      // This would call your AI service
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: section.ai_prompt,
          context: {
            template_name: template.name,
            title,
            existing_content: sectionContent
          }
        })
      })

      if (!response.ok) throw new Error('AI generation failed')

      const { content } = await response.json()
      updateSectionContent(section.id, content, true)
      
      push({
        emoji: '✨',
        title: 'Content Generated',
        description: `AI content generated for ${section.name}`,
        type: 'success'
      })
    } catch (error) {
      push({
        emoji: '❌',
        title: 'Generation Failed',
        description: 'Could not generate AI content. Please try again.',
        type: 'error'
      })
    }
  }

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!title.trim()) {
      push({
        emoji: '⚠️',
        title: 'Title Required',
        description: 'Please enter a title for your content',
        type: 'error'
      })
      return
    }

    setIsSaving(true)

    try {
      const instance: TemplateInstance = {
        id: initialData?.id || `template-${Date.now()}`,
        template_id: template.id,
        title: title.trim(),
        content: Object.values(sectionContent),
        status,
        author_id: 'current-user', // Replace with actual user ID
        created_at: initialData?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: status === 'published' ? new Date().toISOString() : undefined
      }

      await onSave(instance)
      
      push({
        emoji: '🎉',
        title: 'Content Saved',
        description: `Your ${template.name.toLowerCase()} has been ${status === 'published' ? 'published' : 'saved as draft'}`,
        type: 'success'
      })
    } catch (error) {
      push({
        emoji: '💥',
        title: 'Save Failed',
        description: 'Could not save your content. Please try again.',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderSectionEditor = (section: TemplateSection) => {
    const content = sectionContent[section.id]?.content || ''

    switch (section.type) {
      case 'title':
      case 'subtitle':
        return (
          <input
            type="text"
            value={content}
            onChange={(e) => updateSectionContent(section.id, e.target.value)}
            placeholder={section.placeholder}
            className="w-full text-2xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-400"
            maxLength={section.max_length}
          />
        )

      case 'text':
        return (
          <textarea
            value={content}
            onChange={(e) => updateSectionContent(section.id, e.target.value)}
            placeholder={section.placeholder}
            rows={4}
            maxLength={section.max_length}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        )

      case 'rich-text':
        return (
          <div className="border border-gray-300 rounded-lg">
            <textarea
              value={content}
              onChange={(e) => updateSectionContent(section.id, e.target.value)}
              placeholder={section.placeholder}
              rows={8}
              className="w-full p-3 border-none focus:outline-none focus:ring-0 resize-none rounded-lg"
            />
          </div>
        )

      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Handle file upload
                  updateSectionContent(section.id, {
                    type: 'image',
                    file: file,
                    url: URL.createObjectURL(file)
                  })
                }
              }}
              className="hidden"
              id={`upload-${section.id}`}
            />
            <label htmlFor={`upload-${section.id}`} className="cursor-pointer">
              {content?.url ? (
                <Image 
                  src={content.url} 
                  alt="Uploaded" 
                  width={400}
                  height={300}
                  className="max-w-full h-auto mx-auto rounded-lg object-cover"
                />
              ) : (
                <div>
                  <div className="text-4xl mb-4">📷</div>
                  <p className="text-lg text-gray-600">{section.placeholder}</p>
                  <p className="text-sm text-gray-500 mt-2">Click to upload image</p>
                </div>
              )}
            </label>
          </div>
        )

      case 'metadata':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Field 1"
              className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Field 2"
              className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )

      case 'tags':
        return (
          <input
            type="text"
            value={content}
            onChange={(e) => updateSectionContent(section.id, e.target.value)}
            placeholder="Enter tags separated by commas"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        )

      case 'list':
        return (
          <textarea
            value={content}
            onChange={(e) => updateSectionContent(section.id, e.target.value)}
            placeholder="Enter list items (one per line)"
            rows={6}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        )

      default:
        return (
          <textarea
            value={content}
            onChange={(e) => updateSectionContent(section.id, e.target.value)}
            placeholder={section.placeholder}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        )
    }
  }

  const currentSectionData = template.structure[currentSection]
  const isFirstSection = currentSection === 0
  const isLastSection = currentSection === template.structure.length - 1
  const progress = ((currentSection + 1) / template.structure.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            variant="outline"
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Section {currentSection + 1} of {template.structure.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Title Section (always visible) */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a compelling title for your content"
          className="w-full text-xl font-semibold border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Current Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentSectionData.name}
                {currentSectionData.required && <span className="text-red-500 ml-1">*</span>}
              </h2>
              {currentSectionData.placeholder && (
                <p className="text-sm text-gray-600 mt-1">{currentSectionData.placeholder}</p>
              )}
            </div>
            
            {currentSectionData.ai_prompt && (
              <Button
                onClick={() => generateAIContent(currentSectionData)}
                variant="outline"
              >
                ✨ AI Generate
              </Button>
            )}
          </div>

          {/* Section Content Editor */}
          {renderSectionEditor(currentSectionData)}

          {/* Section Status */}
          {sectionContent[currentSectionData.id]?.ai_generated && (
            <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
              ✨ This content was generated by AI. Please review and edit as needed.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={isFirstSection}
          variant="outline"
        >
          ← Previous Section
        </Button>

        {/* Section Navigation */}
        <div className="flex gap-2">
          {template.structure.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSection
                  ? 'bg-indigo-600'
                  : index < currentSection
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              title={`Go to section ${index + 1}`}
            />
          ))}
        </div>

        <Button
          onClick={() => setCurrentSection(Math.min(template.structure.length - 1, currentSection + 1))}
          disabled={isLastSection}
          variant="outline"
        >
          Next Section →
        </Button>
      </div>
    </div>
  )
}