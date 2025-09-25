// 🎭 The Individual Audio Job API Proxy - The Spotlight on Specific Creations
// Guardian of individual audio job operations, ensuring precise control over each masterpiece!

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

// 🎼 Audio Job Data Interface - The Blueprint of Our Audio Creations
interface AudioJobData {
  id: string;
  post_id?: string;
  text_content: string;
  input_text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  config: {
    voice: string;
    voice_preference: string;
    voice_settings: any;
    title: string;
    personality: string;
    speed: number;
  };
  languages: string[];
  completed_languages: string[];
  audio_urls?: Record<string, string>;
  created_at: string;
  updated_at: string;
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

// 🎨 GET /api/audio-jobs/[id] - Inspect a Specific Audio Masterpiece
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // 🎼 Call Audio Jobs Edge Function to get specific job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-jobs/${jobId}`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return createErrorResponse('AUDIO_JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to fetch audio job from Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 100,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[GET /api/audio-jobs/[id]] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get audio job', 500, error);
  }
}

// 🎨 PUT /api/audio-jobs/[id] - Polish and Perfect Our Audio Masterpiece
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();

    // 🎼 Call Audio Jobs Edge Function to update job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-jobs/${jobId}`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return createErrorResponse('AUDIO_JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to update audio job via Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[PUT /api/audio-jobs/[id]] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update audio job', 500, error);
  }
}

// 🗑️ DELETE /api/audio-jobs/[id] - Send Audio Job to the Digital Archives
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // 🎼 Call Audio Jobs Edge Function to delete job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-jobs/${jobId}`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return createErrorResponse('AUDIO_JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to delete audio job via Edge Function',
        response.status,
        errorData
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Audio job deleted successfully',
      job_id: jobId,
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[DELETE /api/audio-jobs/[id]] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete audio job', 500, error);
  }
}
