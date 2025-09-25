import { NextRequest } from 'next/server'
import { withExternalAPIAuth, handleOPTIONS, withCORS, validateRequestBody, ExternalAPIRequest } from '@/lib/external-api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/external-api/auth'
import { createClientForAPI } from '@/lib/supabase/server'

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleOPTIONS()
}

// POST /api/external/ai/generate-audio - Generate audio from text
async function handleGenerateAudio(req: ExternalAPIRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.text) {
      return createErrorResponse('Missing required field: text', 400)
    }

    const {
      text,
      provider = 'openai', // Default to openai for external requests
      voice_id = 'nova',
      voice_settings = {},
      save_to_storage = false, // This will be handled by the audio job processing
      title = 'Generated Audio',
      languages = ['en'], // Default to English if not specified
      post_id = null, // External APIs can optionally link to a post
      callback_url = null // For external systems to get status updates
    } = body
    
    // Validate text length
    if (text.length > 10000) {
      return createErrorResponse('Text too long. Maximum 10,000 characters allowed.', 400)
    }

    const supabase = createClientForAPI()

    // Prepare job data to match Supabase backend expectations
    const jobData: any = {
      input_text: text,
      status: 'pending',
      post_id: post_id, 
      config: {
        voice: voice_id,
        voice_settings: voice_settings,
        title: title,
        tts_provider: provider,
        callback_url: callback_url
      },
      languages: languages,
      is_draft: !save_to_storage, // If not saving to storage, treat as draft
      completed_languages: [],
      current_language: languages?.[0] || 'en'
    }

    // Initialize language statuses
    const languageStatuses: Record<string, any> = {};
    for (const lang of languages) {
      languageStatuses[lang] = {
        status: 'pending',
        draft: !save_to_storage // Treat as draft if not saving to storage
      };
    }
    jobData.language_statuses = languageStatuses;

    console.log('🗄️ External API: Inserting jobData into Supabase')

    // Insert a new job into the audio_jobs table
    const { data: job, error: jobError } = await supabase
      .from('audio_jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.error('External API: Error creating audio job:', jobError);
      return createErrorResponse(`Failed to create audio job: ${jobError.message}`, 500);
    }

    console.log('✅ External API: Created audio job:', job.id)

    // Trigger automatic processing of the job
    try {
      console.log('🚀 External API: Triggering audio job processing...')
      const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audio-jobs/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ job_id: job.id })
      })

      if (!triggerResponse.ok) {
        console.warn('⚠️ External API: Failed to trigger audio job processing, but job created')
      }
    } catch (triggerError) {
      console.warn('⚠️ External API: Audio job trigger error:', triggerError)
      // Don't fail the request if triggering fails
    }
    
    return createSuccessResponse({
      jobId: job.id,
      message: 'Audio generation job submitted successfully. Status can be tracked via /api/audio-jobs/status/{jobId}'
    }, {
      rateLimit: {
        limit: req.auth.apiKey?.rate_limit || 0,
        remaining: req.auth.rateLimitRemaining || 0,
        reset: Date.now() + 3600000
      }
    })
  } catch (error) {
    console.error('Error in handleGenerateAudio:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Move these out as they are now handled by the internal pipeline
// async function generateWithElevenLabs(text: string, voiceId: string, voiceSettings: any = {}) { /* ... */ }
// async function generateWithOpenAI(text: string, voice: string = 'alloy') { /* ... */ }
// async function saveAudioToStorage(supabase: any, audioBuffer: Buffer, title: string, userId: string) { /* ... */ }

// The main POST handler remains the same, but it now calls the refactored handleGenerateAudio
export async function POST(request: NextRequest) {
  return withCORS(await withExternalAPIAuth(request, handleGenerateAudio, ['ai:generate-audio']))
}