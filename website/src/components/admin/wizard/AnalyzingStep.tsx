'use client'

import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'

interface AnalyzingStepProps {
  onComplete: (analysisData: any) => void
  onError: (error: string) => void
  postData: any
}

export default function AnalyzingStep({ onComplete, onError, postData }: AnalyzingStepProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Uploading to AI service...')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const isAnalyzing = useRef(false)

  const performAnalysis = useCallback(async () => {
    try {
      isAnalyzing.current = true // Set flag immediately to prevent duplicate calls
      setHasAnalyzed(true)
      
      // Simulate progress updates
      const steps = [
        'Uploading to AI service...',
        'Processing image data...',
        'Analyzing visual elements...',
        'Generating content suggestions...',
        'Finalizing results...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        setProgress((i + 1) * 20)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // Perform actual analysis
      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for session authentication
        body: JSON.stringify({
          image_url: postData.imageUrl,
          prompt: postData.analysisPrompt,
          analysis_type: 'detailed',
          providers: ['openai']
        })
      })

      const result = await response.json()
      console.log('AnalyzingStep - Full response:', response)
      console.log('AnalyzingStep - Response status:', response.status)
      console.log('AnalyzingStep - Response ok:', response.ok)
      console.log('AnalyzingStep - Result:', result)
      console.log('AnalyzingStep - Error details:', result.error)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Request failed'}`)
      }
      
      if (result.success) {
        setProgress(100)
        setCurrentStep('Analysis complete!')
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('AnalyzingStep - Calling onComplete with:', result.data)
        isAnalyzing.current = false // Reset flag on success
        onComplete(result.data)
      } else {
        console.log('AnalyzingStep - Analysis failed:', result.error)
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      isAnalyzing.current = false // Reset flag on error
      setHasAnalyzed(false) // Reset flag on error so user can retry
      onError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }, [postData.imageUrl, postData.analysisPrompt, onComplete, onError])

  useEffect(() => {
    console.log('AnalyzingStep - postData received:', postData)
    console.log('AnalyzingStep - imageUrl:', postData?.imageUrl)
    console.log('AnalyzingStep - analysisPrompt:', postData?.analysisPrompt)
    console.log('AnalyzingStep - hasAnalyzed:', hasAnalyzed)
    
    // Prevent re-analysis if already completed or currently analyzing
    if (hasAnalyzed || !postData.imageUrl || isAnalyzing.current) {
      console.log('AnalyzingStep - Skipping analysis:', { hasAnalyzed, hasImageUrl: !!postData.imageUrl, isAnalyzing: isAnalyzing.current })
      return
    }
    
    performAnalysis()
  }, [hasAnalyzed, postData.imageUrl, performAnalysis, postData])

  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-8">Analyzing Your Image</h2>
      
      {/* Image Preview */}
      {postData.imageUrl && (
        <div className="mb-8">
          <Image 
            src={postData.imageUrl} 
            alt="Uploaded image" 
            width={200} 
            height={200} 
            className="mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Loading Animation */}
      <div className="mb-6">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{progress}% complete</p>
      </div>

      {/* Current Step */}
      <p className="text-lg text-gray-700 mb-4">{currentStep}</p>
      
      {/* Fun Facts */}
      <div className="max-w-lg mx-auto text-sm text-gray-500">
        <p className="mb-2">💡 <strong>Did you know?</strong> Our AI can identify artistic styles, suggest titles, and generate detailed descriptions in seconds.</p>
        <p>✨ Sit back and relax while we create amazing content for your post!</p>
      </div>
    </div>
  )
}