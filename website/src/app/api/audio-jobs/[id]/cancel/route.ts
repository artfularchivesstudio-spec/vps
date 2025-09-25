// 🎭 The Audio Job Cancel API Proxy - The Gentle Stop
// Guardian of graceful cancellations, ensuring no performance goes unfinished!

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

// 🎭 POST /api/audio-jobs/[id]/cancel - Gracefully Stop Audio Processing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();

    // 🎨 Prepare Cancellation Request - Craft Our Gentle Stop Instructions
    const cancellationRequest = {
      job_id: jobId,
      reason: body.reason || 'User requested cancellation',
      force: body.force || false,
      cleanup_resources: body.cleanup_resources !== false // Default to true
    };

    // 🎼 Call Audio Jobs Edge Function to cancel processing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-jobs/${jobId}/cancel`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cancellationRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return createErrorResponse('AUDIO_JOB_NOT_FOUND', 'Audio job not found', 404);
      }
      if (response.status === 409) {
        return createErrorResponse('JOB_NOT_PROCESSING', 'Audio job is not currently processing', 409);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to cancel audio processing via Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'cancelled',
        cancelled_at: data.cancelled_at,
        reason: cancellationRequest.reason,
        resources_cleaned: data.resources_cleaned || false
      },
      message: 'Audio processing cancelled successfully',
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 97,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[POST /api/audio-jobs/[id]/cancel] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to cancel audio processing', 500, error);
  }
}
