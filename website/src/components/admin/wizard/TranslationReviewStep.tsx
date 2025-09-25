/**
 * 🎭 The Translation Review Theatre - Where All Languages Take Their Final Bow
 *
 * "In this magnificent review hall, where every translation receives its final polish,
 * we present all languages side by side like actors in a grand ensemble cast.
 * Each translation is reviewed, refined, and blessed before the audio performance begins."
 *
 * - The Multilingual Stage Director
 */

'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/ToastProvider'
import { useState } from 'react'

interface TranslationReviewStepProps {
  onNext: () => void
  onBack: () => void
  postData: any
  onDataUpdate: (data: any) => void
}

export default function TranslationReviewStep({ onNext, onBack, postData, onDataUpdate }: TranslationReviewStepProps) {
  const [isEditingMode, setIsEditingMode] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const { push } = useToast()
  const [editedTranslations, setEditedTranslations] = useState({
    en: { title: postData.title || '', content: postData.content || '' },
    es: { 
      title: postData.title_translations?.es || '', 
      content: postData.content_translations?.es || '' 
    },
    hi: { 
      title: postData.title_translations?.hi || '', 
      content: postData.content_translations?.hi || '' 
    }
  })

  // 🌍 Our theatrical cast of languages
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', description: 'The Original Script' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', description: 'La Traducción Española' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', description: 'हिंदी अनुवाद' }
  ]

  const handleEdit = (langCode: string, field: string, value: string) => {
    setEditedTranslations(prev => ({
      ...prev,
      [langCode]: {
        ...prev[langCode as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const toggleEditMode = (langCode: string) => {
    setIsEditingMode(prev => ({
      ...prev,
      [langCode]: !prev[langCode]
    }))
  }

  const handleSaveAndNext = async () => {
    // 💾 Preserve the polished translations for the audio generation step
    const updatedData = {
      ...postData,
      title: editedTranslations.en.title,
      content: editedTranslations.en.content,
      title_translations: {
        es: editedTranslations.es.title,
        hi: editedTranslations.hi.title
      },
      content_translations: {
        es: editedTranslations.es.content,
        hi: editedTranslations.hi.content
      }
    }
    
    // 🎭 Now save the translations to the database!
    setIsSaving(true)
    try {
      if (!postData.savedPostId) {
        throw new Error('No saved post ID found. Please go back and save the post first.')
      }

      const res = await fetch(`/api/admin/posts?id=${postData.savedPostId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTranslations.en.title,
          content: editedTranslations.en.content,
          title_translations: {
            es: editedTranslations.es.title,
            hi: editedTranslations.hi.title
          },
          content_translations: {
            es: editedTranslations.es.content,
            hi: editedTranslations.hi.content
          }
        })
      })

      if (!res.ok) throw new Error('Failed to save translations')

      push({ 
        emoji: '🌍', 
        title: 'Translations saved', 
        description: 'All language versions have been saved to database', 
        type: 'success' 
      })
      
      onDataUpdate(updatedData)
      onNext()
    } catch (e: any) {
      push({ 
        emoji: '❌', 
        title: 'Failed to save translations', 
        description: e?.message || 'Unknown error occurred', 
        type: 'error' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 🎭 The Grand Theatre Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎭 Translation Review Theatre
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Review and refine your multilingual masterpiece before the voices are recorded
        </p>
        <div className="flex justify-center gap-2 text-sm text-gray-500">
          <span>🎪 All Languages</span>
          <span>•</span>
          <span>👀 Final Review</span>
          <span>•</span>
          <span>🎵 Ready for Audio</span>
        </div>
      </div>

      {/* 🌍 The Multilingual Performance Hall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {languages.map((lang) => {
          const isEditing = isEditingMode[lang.code]
          const translation = editedTranslations[lang.code as keyof typeof editedTranslations]
          const hasContent = translation.title || translation.content
          
          return (
            <Card key={lang.code} className={`border-2 transition-all duration-200 ${
              hasContent ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{lang.name}</h3>
                      <p className="text-xs text-gray-500 font-normal">{lang.description}</p>
                    </div>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleEditMode(lang.code)}
                    className="text-xs"
                  >
                    {isEditing ? '💾 Save' : '✏️ Edit'}
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {/* Title Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Title
                  </label>
                  {isEditing ? (
                    <textarea
                      value={translation.title}
                      onChange={(e) => handleEdit(lang.code, 'title', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm resize-none"
                      rows={2}
                      placeholder={`${lang.name} title...`}
                    />
                  ) : (
                    <div className={`p-2 bg-white rounded border min-h-[3rem] text-sm ${
                      !translation.title ? 'text-gray-400 italic' : 'text-gray-900'
                    }`}>
                      {translation.title || `No ${lang.name} title yet...`}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📖 Content
                  </label>
                  {isEditing ? (
                    <textarea
                      value={translation.content}
                      onChange={(e) => handleEdit(lang.code, 'content', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm resize-none"
                      rows={8}
                      placeholder={`${lang.name} content...`}
                    />
                  ) : (
                    <div className={`p-2 bg-white rounded border min-h-[8rem] text-sm ${
                      !translation.content ? 'text-gray-400 italic' : 'text-gray-900'
                    }`}>
                      {translation.content ? (
                        <div className="whitespace-pre-wrap">{translation.content.substring(0, 200)}
                        {translation.content.length > 200 && '...'}</div>
                      ) : (
                        `No ${lang.name} content yet...`
                      )}
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="mt-3 flex items-center justify-between">
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    hasContent 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {hasContent ? '✅ Ready' : '⚠️ Needs Content'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {translation.content.length} characters
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 🎪 The Director's Control Panel */}
      <div className="flex justify-between items-center">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          ← Back to Translation
        </Button>

        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            🎭 Review complete? Ready for audio generation!
          </div>
          <div className="text-xs text-gray-500">
            Audio will be generated using each language&apos;s finalized text
          </div>
        </div>

        <Button
          onClick={handleSaveAndNext}
          size="lg"
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? '💾 Saving...' : '🎵 Generate Audio →'}
        </Button>
      </div>

      {/* 🌟 The Theatrical Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>🎭 &quot;Each translation is a doorway to a new audience&apos;s heart&quot;</p>
      </div>
    </div>
  )
}