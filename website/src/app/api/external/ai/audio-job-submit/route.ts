import { NextRequest } from 'next/server'
import { withExternalAPIAuth, handleOPTIONS, withCORS, validateRequestBody, ExternalAPIRequest } from '@/lib/external-api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/external-api/auth'
import { createClientForAPI } from '@/lib/supabase/server'

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleOPTIONS()
}

interface AudioJobPayload {
  text: string
  languages?: string[]
  voice_settings?: {
    speed?: number
    voice_gender?: 'male' | 'female'
    personality?: 'art_dealer' | 'art_instructor' | 'hybrid'
    voices?: Record<string, string>
  }
  title?: string
  post_id?: string
  is_draft?: boolean
}

// POST /api/external/ai/audio-job-submit - Submit audio generation job
async function handleAudioJobSubmit(req: ExternalAPIRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.text) {
      return createErrorResponse('Missing required field: text', 400)
    }
    
    const { 
      text, 
      languages = ['en'],
      voice_settings = {},
      title,
      post_id,
      is_draft = false
    }: AudioJobPayload = body
    
    // Validate languages
    const validLanguages = ['en', 'es', 'hi']
    const filteredLanguages = languages.filter(lang => validLanguages.includes(lang))
    if (filteredLanguages.length === 0) {
      return createErrorResponse('No valid languages specified. Supported: en, es, hi', 400)
    }
    
    // Validate text length
    if (text.length > 50000) {
      return createErrorResponse('Text too long. Maximum 50,000 characters allowed.', 400)
    }
    
    // Submit job to Supabase Edge Function
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return createErrorResponse('Supabase configuration missing', 500)
    }
    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-job-submit`
    
    const payload = {
      text,
      languages: filteredLanguages,
      voice_settings,
      title,
      post_id,
      is_draft
    }
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'X-Simple-Auth': 'chatgpt-actions'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge function error:', errorText)
      return createErrorResponse(`Audio job submission failed: ${response.status}`, 500)
    }
    
    const result = await response.json()
    
    return createSuccessResponse({
      job_id: result.job?.id,
      message: result.message,
      languages: filteredLanguages,
      is_draft
    })
    
  } catch (error: any) {
    console.error('Audio job submission error:', error)
    return createErrorResponse(`Failed to submit audio job: ${error.message}`, 500)
  }
}

export async function POST(request: NextRequest) {
  return withCORS(await withExternalAPIAuth(request, handleAudioJobSubmit, ['ai:generate-audio']))
}