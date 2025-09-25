import { NextRequest } from 'next/server'
import { withExternalAPIAuth, handleOPTIONS, withCORS, ExternalAPIRequest } from '@/lib/external-api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/external-api/auth'
import { createClientForAPI } from '@/lib/supabase/server'

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleOPTIONS()
}

// GET /api/external/ai/audio-job-status/[job_id] - Get audio job status
async function handleAudioJobStatus(req: ExternalAPIRequest, { params }: { params: { job_id: string } }) {
  try {
    const { job_id } = params
    
    if (!job_id) {
      return createErrorResponse('Missing job_id parameter', 400)
    }
    
    const supabase = createClientForAPI()
    
    // Fetch job status from database
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return createErrorResponse(`Job not found: ${job_id}`, 404)
    }
    
    if (!job) {
      return createErrorResponse(`Job not found: ${job_id}`, 404)
    }
    
    // Format response
    const response = {
      job_id: job.id,
      status: job.status,
      created_at: job.created_at,
      updated_at: job.updated_at,
      languages: job.languages || [],
      completed_languages: job.completed_languages || [],
      current_language: job.current_language,
      is_draft: job.is_draft,
      total_chunks: job.total_chunks,
      processed_chunks: job.processed_chunks,
      language_statuses: job.language_statuses || {},
      error_message: job.error_message
    }
    
    // Add audio URLs if available
    if (job.audio_urls) {
      (response as any).audio_urls = job.audio_urls
    }
    
    // Add individual language audio URLs from language_statuses
    if (job.language_statuses) {
      const audioUrls: Record<string, string> = {}
      for (const [lang, status] of Object.entries(job.language_statuses as Record<string, any>)) {
        if (status && typeof status === 'object' && status.audio_url) {
          audioUrls[lang] = status.audio_url
        }
      }
      if (Object.keys(audioUrls).length > 0) {
        (response as any).audio_urls = audioUrls
      }
    }
    
    return createSuccessResponse(response)
    
  } catch (error: any) {
    console.error('Audio job status error:', error)
    return createErrorResponse(`Failed to get job status: ${error.message}`, 500)
  }
}

export async function GET(request: NextRequest, { params }: { params: { job_id: string } }) {
  return withCORS(await withExternalAPIAuth(request, (req: ExternalAPIRequest) => handleAudioJobStatus(req, { params }), ['ai:audio-status']))
}