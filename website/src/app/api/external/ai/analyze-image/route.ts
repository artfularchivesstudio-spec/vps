import { NextRequest } from 'next/server'
import { withExternalAPIAuth, handleOPTIONS, withCORS, validateRequestBody, ExternalAPIRequest } from '@/lib/external-api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/external-api/auth'
import { analyzeImage, ImageAnalysisRequest } from '@/lib/ai/image-analysis'

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleOPTIONS()
}

// POST /api/external/ai/analyze-image - Analyze image with AI
async function handleAnalyzeImage(req: ExternalAPIRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.image_data) {
      return createErrorResponse('Missing required field: image_data', 400)
    }
    
    const { 
      image_data, 
      analysis_type = 'detailed',
      providers = ['openai'],
      custom_prompt
    } = body
    
    // Validate image data format
    if (!image_data.startsWith('data:image/')) {
      return createErrorResponse('Invalid image data format. Must be base64 data URL.', 400)
    }
    
    // Use the shared image analysis service
    const analysisRequest: ImageAnalysisRequest = {
      image_data: image_data,
      custom_prompt: custom_prompt,
      providers,
      analysis_type: analysis_type
    }

    const analysisResult = await analyzeImage(analysisRequest)

    if (!analysisResult.success) {
      return createErrorResponse(analysisResult.error || 'Analysis failed', 500)
    }

    // Add rate limiting info to response
    const responseData = {
      ...analysisResult.data,
      timestamp: new Date().toISOString(),
      analysis_type,
      providers_used: providers
    }

    return createSuccessResponse(responseData, {
      rateLimit: {
        limit: req.auth.apiKey?.rate_limit || 0,
        remaining: req.auth.rateLimitRemaining || 0,
        reset: Date.now() + 3600000
      }
    })
  } catch (error) {
    console.error('Error in handleAnalyzeImage:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  return withCORS(await withExternalAPIAuth(request, handleAnalyzeImage, ['ai:analyze']))
}