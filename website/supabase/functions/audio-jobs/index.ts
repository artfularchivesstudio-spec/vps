import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// 🎭 The Spellbinding Audio Jobs Conductor
// Where audio dreams become reality through the mystical power of Edge Functions!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// 🎨 Error Response Interface - Our Safety Net
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    status: number;
    timestamp: string;
    requestId?: string;
  };
}

// 🎵 Audio Job Data Interface - The Blueprint of Our Audio Creations
interface AudioJobData {
  id: string;
  text_content: string;
  input_text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial_success';
  config: {
    voice: string;
    voice_preference: string;
    voice_settings: any;
    title: string;
    personality: string;
    speed: number;
  };
  post_id?: string;
  languages: string[];
  is_draft: boolean;
  language_statuses: Record<string, { status: string; draft: boolean }>;
  completed_languages: string[];
  audio_urls?: Record<string, string>;
  errors?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// 🎼 The Grand Audio Jobs Handler - Our Master Conductor
Deno.serve(async (req) => {
  // 🎭 CORS Support - Welcoming All Visitors
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // 🎯 Route the Performance - Direct Each Request to Its Proper Stage
    switch (method) {
      case 'GET':
        if (pathParts.length === 1) {
          // GET /audio-jobs - List all audio jobs
          return await listAudioJobs(req);
        } else if (pathParts.length === 2) {
          // GET /audio-jobs/{id} - Get specific audio job
          const jobId = pathParts[1];
          return await getAudioJob(req, jobId);
        }
        break;

      case 'POST':
        if (pathParts.length === 1) {
          // POST /audio-jobs - Create new audio job
          return await createAudioJob(req);
        } else if (pathParts.length === 3 && pathParts[2] === 'process') {
          // POST /audio-jobs/{id}/process - Process audio job
          const jobId = pathParts[1];
          return await processAudioJob(req, jobId);
        } else if (pathParts.length === 3 && pathParts[2] === 'cancel') {
          // POST /audio-jobs/{id}/cancel - Cancel audio job
          const jobId = pathParts[1];
          return await cancelAudioJob(req, jobId);
        }
        break;

      case 'PUT':
        if (pathParts.length === 2) {
          // PUT /audio-jobs/{id} - Update audio job
          const jobId = pathParts[1];
          return await updateAudioJob(req, jobId);
        }
        break;

      case 'DELETE':
        if (pathParts.length === 2) {
          // DELETE /audio-jobs/{id} - Delete audio job
          const jobId = pathParts[1];
          return await deleteAudioJob(req, jobId);
        }
        break;
    }

    // 🎪 Route Not Found - The Show Must Go On!
    return createErrorResponse('ROUTE_NOT_FOUND', 'The requested audio job route does not exist', 404);

  } catch (error) {
    console.error('[audio-jobs] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500, error);
  }
});

// 🎭 List Audio Jobs - Browse Our Musical Collection
async function listAudioJobs(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status');
    const postId = url.searchParams.get('post_id');

    let query = supabase
      .from('audio_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (postId) {
      query = query.eq('post_id', postId);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('[listAudioJobs] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve audio jobs', 500, error);
    }

    return new Response(JSON.stringify({
      success: true,
      data: jobs,
      pagination: {
        limit,
        offset,
        hasMore: jobs.length === limit
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[listAudioJobs] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to list audio jobs', 500, error);
  }
}

// 🎨 Get Audio Job - Inspect a Specific Musical Masterpiece
async function getAudioJob(req: Request, jobId: string) {
  try {
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      console.error('[getAudioJob] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve audio job', 500, error);
    }

    return new Response(JSON.stringify({
      success: true,
      data: job
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[getAudioJob] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get audio job', 500, error);
  }
}

// 🎵 Create Audio Job - Birth a New Musical Creation
async function createAudioJob(req: Request) {
  try {
    const body = await req.json();

    // 🎭 Validate Input - Ensure Our Creation Has All Required Elements
    const requiredFields = ['text_content', 'languages'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse('VALIDATION_ERROR', `Missing required field: ${field}`, 400);
      }
    }

    // 🎨 Prepare Language Statuses - Set the Stage for Each Language
    const languageStatuses: Record<string, { status: string; draft: boolean }> = {};
    body.languages.forEach((lang: string) => {
      languageStatuses[lang] = {
        status: 'pending',
        draft: body.is_draft && body.draft_language === lang
      };
    });

    // 🎪 Create the Audio Job - Summon the Musical Spirit
    const jobData = {
      text_content: body.text_content,
      input_text: body.input_text || body.text_content,
      status: 'pending',
      config: {
        voice: body.voice || (body.voice_settings?.voice_gender === 'male' ? 'fable' : 'alloy'),
        voice_preference: body.voice_settings?.voice_gender || 'female',
        voice_settings: body.voice_settings || {},
        title: body.title || 'Audio Creation',
        personality: body.voice_settings?.personality || 'hybrid',
        speed: body.voice_settings?.speed || 1.1
      },
      post_id: body.post_id,
      languages: body.languages,
      is_draft: body.is_draft || false,
      language_statuses: languageStatuses,
      completed_languages: [],
      audio_urls: {},
      errors: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: job, error } = await supabase
      .from('audio_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error('[createAudioJob] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to create audio job', 500, error);
    }

    return new Response(JSON.stringify({
      success: true,
      data: job
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[createAudioJob] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create audio job', 500, error);
  }
}

// ⚡ Process Audio Job - Let the Magic Begin!
async function processAudioJob(req: Request, jobId: string) {
  try {
    // 🎭 Get the Job - Retrieve Our Musical Creation
    const { data: job, error: fetchError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch audio job', 500, fetchError);
    }

    if (job.status === 'processing') {
      return createErrorResponse('JOB_ALREADY_PROCESSING', 'Audio job is already being processed', 409);
    }

    // 🎨 Update Status - Begin the Performance
    await supabase
      .from('audio_jobs')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // 🎵 Process the Audio - The Main Performance
    // This would typically trigger background processing
    // For now, we'll simulate the start of processing

    return new Response(JSON.stringify({
      success: true,
      message: 'Audio job processing started',
      job_id: jobId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[processAudioJob] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to process audio job', 500, error);
  }
}

// 🛑 Cancel Audio Job - Stop the Show (Gracefully)
async function cancelAudioJob(req: Request, jobId: string) {
  try {
    const { data: job, error: fetchError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch audio job', 500, fetchError);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return createErrorResponse('JOB_CANNOT_CANCEL', 'Cannot cancel a job that is already completed or failed', 409);
    }

    // 🎭 Cancel the Job - End the Performance
    const { error: updateError } = await supabase
      .from('audio_jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to cancel audio job', 500, updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Audio job cancelled successfully',
      job_id: jobId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[cancelAudioJob] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to cancel audio job', 500, error);
  }
}

// 🎨 Update Audio Job - Polish and Perfect
async function updateAudioJob(req: Request, jobId: string) {
  try {
    const body = await req.json();

    const { data: job, error: fetchError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch audio job', 500, fetchError);
    }

    // 🎭 Prepare Update Data - Refine Our Creation
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only allow updates to certain fields
    const allowedFields = ['config', 'audio_urls', 'errors', 'status'];
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    const { data: updatedJob, error: updateError } = await supabase
      .from('audio_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to update audio job', 500, updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: updatedJob
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[updateAudioJob] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update audio job', 500, error);
  }
}

// 🗑️ Delete Audio Job - Send to the Digital Afterlife
async function deleteAudioJob(req: Request, jobId: string) {
  try {
    const { data: job, error: fetchError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch audio job', 500, fetchError);
    }

    // 🎭 Delete Associated Audio Files - Clean Up the Stage
    if (job.audio_urls) {
      for (const [lang, url] of Object.entries(job.audio_urls)) {
        try {
          // Extract file path from Supabase storage URL
          const filePath = url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from('audio-assets')
              .remove([filePath]);
          }
        } catch (storageError) {
          console.warn(`Failed to delete audio file for ${lang}:`, storageError);
          // Continue with deletion even if storage cleanup fails
        }
      }
    }

    // 🗑️ Delete the Job - Final Curtain
    const { error: deleteError } = await supabase
      .from('audio_jobs')
      .delete()
      .eq('id', jobId);

    if (deleteError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to delete audio job', 500, deleteError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Audio job deleted successfully',
      job_id: jobId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[deleteAudioJob] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete audio job', 500, error);
  }
}

// 🎪 Create Error Response - Our Safety Net
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any,
  requestId?: string
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(requestId && { requestId })
    }
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
