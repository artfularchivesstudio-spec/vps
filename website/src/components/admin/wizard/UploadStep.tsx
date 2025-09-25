'use client'

import React from 'react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/observability/logger'
import { useToast } from '@/components/ui/ToastProvider'

interface UploadStepProps {
  onNext: (analysisPrompt: string, uploadedImageUrl: string) => void
  setPostData: (data: any) => void
}

export default function UploadStep({ onNext, setPostData }: UploadStepProps) {
  const supabase = createClient()
  const { push } = useToast()
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisPrompt, setAnalysisPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadToStorage = async (file: File): Promise<string> => {
    console.info('⬆️  UploadStep: starting storage upload…')
    console.time('⏱️ UploadStep.uploadToStorage')
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file)

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    const publicUrl = (urlData?.publicUrl || '').replace(/([^:]\/)\/+/, '$1/')
    console.timeEnd('⏱️ UploadStep.uploadToStorage')
    console.info('✅ UploadStep: storage upload complete')
    await logger.logSuccess('upload_complete', '🖼️ Image uploaded to storage', { fileName, publicUrl })
    push({ emoji: '🖼️', title: 'Image uploaded', description: 'Stored and ready for analysis', type: 'success' })
    // Fallback to blob URL in dev/test when no public URL is available
    return publicUrl || URL.createObjectURL(file)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setError(null)
    console.info('📥 UploadStep: file dropped', { name: file.name, size: file.size })
    setUploadedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
      console.info('🖼️ UploadStep: preview ready')
    }
    reader.readAsDataURL(file)
    // Optimistically set a blob URL for immediate UI enablement
    try {
      const blobUrl = URL.createObjectURL(file)
      setImageUrl(blobUrl)
      setPostData((prev: any) => ({ ...prev, imageUrl: blobUrl }))
      await logger.logSuccess('upload_preview_ready', '🔎 Preview ready, blob URL set')
      push({ emoji: '🔎', title: 'Preview ready', description: 'You can continue when ready', type: 'info' })
    } catch {
      // ignore
    }
  }, [setPostData, push])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] } })

  const handleNext = async () => {
    if (!uploadedImage) {
      setError('Please upload an image before proceeding.')
      push({
        emoji: '⚠️',
        title: 'No image',
        description: 'Please upload an image to continue',
        type: 'warning',
      })
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Upload to Supabase Storage to get a public URL
      const publicUrl = await uploadToStorage(uploadedImage)
      console.log('UploadStep: Got public URL:', publicUrl)
      
      // Update the postData with the public URL
      setPostData((prev: any) => ({ ...prev, imageUrl: publicUrl }))
      
      // Call onNext with the public URL that Supabase function can access
      onNext(analysisPrompt, publicUrl)  } catch (error) {
      console.error('UploadStep: Upload failed:', error)
      setError('Failed to upload image. Please try again.')
      push({
        emoji: '❌',
        title: 'Upload failed',
        description: 'Please try uploading the image again',
        type: 'error',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1: Upload Your Image</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
      )}

      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
        <input {...getInputProps()} />
        {imagePreview ? (
          <Image src={imagePreview} alt="Preview" width={200} height={200} className="mx-auto rounded-lg" />
        ) : (
          <p>Drag &apos;n&apos; drop an image here, or click to select one.</p>
        )}
      </div>

      {isUploading && (
        <div className="mt-4 text-sm text-gray-600">Uploading image...</div>
      )}

      <div className="mt-6">
        <label htmlFor="analysis-prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Analysis Prompt (Optional)
        </label>
        <textarea
          id="analysis-prompt"
          rows={4}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          value={analysisPrompt}
          onChange={(e) => setAnalysisPrompt(e.target.value)}
          placeholder="e.g., 'This is a Kandinsky painting, focus on the abstract expressionism...'"
        />
        <p className="mt-2 text-xs text-gray-500">
          Provide any specific context or instructions for the AI analysis.
        </p>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!uploadedImage || isUploading}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
