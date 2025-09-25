// 🎭 The Audio Jobs API Proxy - Bridge Between Frontend and Edge Functions
// Guardian of the audio generation workflow, ensuring seamless communication!

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

// 🎭 GET /api/audio-jobs - List Audio Jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 🎨 Build query parameters for Edge Function
    const queryParams = new URLSearchParams();
    if (postId) queryParams.set('post_id', postId);
    if (status) queryParams.set('status', status);
    queryParams.set('limit', limit.toString());
    queryParams.set('offset', offset.toString());

    // 🎼 Call Audio Jobs Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-jobs?${queryParams.toString()}`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to fetch audio jobs from Edge Function',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    // 🎨 Add pagination metadata
    const result = {
      success: true,
      data: data.data || [],
      pagination: {
        limit,
        offset,
        hasMore: (data.data || []).length === limit,
        total: data.meta?.pagination?.total || 0
      },
      meta: {
        rateLimit: {
          limit: 100,
          remaining: 100,
          reset: Date.now() + 3600000
        }
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[GET /api/audio-jobs] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to list audio jobs', 500, error);
  }
}

// 🎵 POST /api/audio-jobs - Create New Audio Job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 🎭 Validate Input - Ensure Our Creation Has All Required Elements
    const requiredFields = ['text_content', 'languages'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse('VALIDATION_ERROR', `Missing required field: ${field}`, 400);
      }
    }

    // 🎨 Prepare Audio Job Data - Craft Our Audio Masterpiece
    const audioJobData = {
      text_content: body.text_content,
      input_text: body.input_text || body.text_content,
      post_id: body.post_id,
      languages: body.languages,
      config: {
        voice: body.voice || 'alloy',
        voice_preference: body.voice_preference || 'female',
        voice_settings: body.voice_settings || {},
        title: body.title || 'Audio Content',
        personality: body.personality || 'hybrid',
        speed: body.speed || 1.1
      },
      is_draft: body.is_draft || false,
      language_statuses: body.language_statuses || {},
      completed_languages: [],
      current_language: body.is_draft ? body.draft_language : null
    };

    // 🎼 Call Audio Jobs Edge Function to create job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('CONFIG_ERROR', 'Supabase configuration missing', 500);
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/audio-jobs`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(audioJobData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return createErrorResponse(
        'EDGE_FUNCTION_ERROR',
        'Failed to create audio job via Edge Function',
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
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/audio-jobs] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create audio job', 500, error);
  }
}
