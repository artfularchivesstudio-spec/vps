// 🎭 The Audio Job Process API Proxy - The Conductor's Baton
// Guardian of the audio processing workflow, ensuring each job gets its perfect performance!

import { NextRequest, NextResponse } from 'next/server';

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

// 🎪 Create Error Response - Our Safety Net
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any,
  requestId?: string
): NextResponse {
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

  return NextResponse.json(errorResponse, { status });
}

// 🎵 POST /api/audio-jobs/[id]/process - Start Audio Processing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();

    // 🎭 Validate Input - Ensure Our Performance Has All Required Elements
    const requiredFields = ['languages'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse('VALIDATION_ERROR', `Missing required field: ${field}`, 400);
      }
    }

    // 🎨 Prepare Processing Request - Craft Our Performance Instructions
    const processingRequest = {
      job_id: jobId,
      languages: body.languages,
      priority: body.priority || 'normal',
      force_regeneration: body.force_regeneration || false,
      custom_config: body.custom_config || {}
    };

    // 🎼 Call Audio Jobs Edge Function to start processing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-jobs/${jobId}/process`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processingRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return createErrorResponse('AUDIO_JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      if (response.status === 409) {
        return createErrorResponse('JOB_ALREADY_PROCESSING', 'Audio job is already being processed', 409);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to start audio processing via Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'processing_started',
        processing_id: data.processing_id,
        estimated_completion: data.estimated_completion,
        languages: body.languages
      },
      message: 'Audio processing started successfully',
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 98,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[POST /api/audio-jobs/[id]/process] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to start audio processing', 500, error);
  }
}
