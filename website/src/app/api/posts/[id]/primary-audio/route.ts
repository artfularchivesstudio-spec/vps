// 🎭 The Posts Primary Audio API Proxy - The Crown Jewel Selector
// Guardian of the primary audio selection, ensuring each post has its perfect voice!

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

// 🎼 Primary Audio Data Interface - The Chosen One
interface PrimaryAudioData {
  audio_asset_id: string;
  language?: string;
  reason?: string;
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

// 🎨 PUT /api/posts/[id]/primary-audio - Crown the Primary Audio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const body = await request.json();

    // 🎭 Validate Input - Ensure Our Crown Jewel Selection Is Valid
    const requiredFields = ['audio_asset_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse('VALIDATION_ERROR', `Missing required field: ${field}`, 400);
      }
    }

    // 🎨 Prepare Primary Audio Selection - Craft Our Coronation Ceremony
    const primaryAudioData: PrimaryAudioData = {
      audio_asset_id: body.audio_asset_id,
      language: body.language,
      reason: body.reason || 'User selected as primary audio'
    };

    // 🎼 Call Posts Edge Function to set primary audio
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/posts/${postId}/primary-audio`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(primaryAudioData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      if (response.status === 409) {
        return createErrorResponse('AUDIO_ASSET_NOT_FOUND', 'Audio asset not found or not associated with this post', 409);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to set primary audio via Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        post_id: postId,
        primary_audio_id: body.audio_asset_id,
        language: body.language,
        updated_at: data.updated_at,
        previous_primary_audio_id: data.previous_primary_audio_id
      },
      message: 'Primary audio set successfully',
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 96,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[PUT /api/posts/[id]/primary-audio] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to set primary audio', 500, error);
  }
}

// 🎨 GET /api/posts/[id]/primary-audio - Behold the Crown Jewel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // 🎼 Call Posts Edge Function to get primary audio
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/posts/${postId}/primary-audio`;

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
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to get primary audio via Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data || null,
      post_id: postId,
      meta: {
        has_primary_audio: !!data.data,
        rateLimit: {
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[GET /api/posts/[id]/primary-audio] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get primary audio', 500, error);
  }
}
