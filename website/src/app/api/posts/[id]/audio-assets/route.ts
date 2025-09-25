// 🎭 The Posts Audio Assets API Proxy - The Soundtrack Curator
// Guardian of the audio assets that accompany our blog posts, ensuring perfect harmony!

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

// 🎼 Audio Asset Data Interface - The Musical Treasures
interface AudioAssetData {
  id: string;
  post_id: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  language: string;
  title: string;
  duration_seconds?: number;
  transcription?: string;
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

// 🎨 GET /api/posts/[id]/audio-assets - Discover the Soundtrack
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    // 🎼 Call Posts Edge Function to get audio assets
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const queryParams = new URLSearchParams();
    if (language) queryParams.set('language', language);

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/posts/${postId}/audio-assets?${queryParams.toString()}`;

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
        'Failed to fetch audio assets from Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data || [],
      post_id: postId,
      meta: {
        total: data.meta?.total || 0,
        languages: data.meta?.languages || [],
        rateLimit: {
          limit: 100,
          remaining: 100,
          reset: Date.now() + 3600000
        }
      }
    });

  } catch (error) {
    console.error('[GET /api/posts/[id]/audio-assets] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get audio assets', 500, error);
  }
}

// 🎵 POST /api/posts/[id]/audio-assets - Add a New Musical Piece
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const body = await request.json();

    // 🎭 Validate Input - Ensure Our Musical Addition Has All Required Elements
    const requiredFields = ['file_url', 'language'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse('VALIDATION_ERROR', `Missing required field: ${field}`, 400);
      }
    }

    // 🎨 Prepare Audio Asset Data - Craft Our Musical Masterpiece
    const audioAssetData = {
      post_id: postId,
      file_url: body.file_url,
      file_type: body.file_type || 'audio',
      mime_type: body.mime_type || 'audio/mpeg',
      file_size_bytes: body.file_size_bytes || 0,
      language: body.language,
      title: body.title || `Audio for Post ${postId}`,
      duration_seconds: body.duration_seconds,
      transcription: body.transcription,
      metadata: body.metadata || {}
    };

    // 🎼 Call Posts Edge Function to create audio asset
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/posts/${postId}/audio-assets`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(audioAssetData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return createErrorResponse('POST_NOT_FOUND', 'Post not found', 404);
      }
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to create audio asset via Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Audio asset added successfully',
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/posts/[id]/audio-assets] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to add audio asset', 500, error);
  }
}
