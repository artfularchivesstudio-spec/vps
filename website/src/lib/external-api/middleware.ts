import { NextRequest, NextResponse } from 'next/server'
import { externalAPIAuth, AuthContext, createErrorResponse } from './auth'

export interface ExternalAPIRequest extends NextRequest {
  auth: AuthContext
}

/**
 * Middleware to authenticate and authorize external API requests
 */
export async function withExternalAPIAuth(
  request: NextRequest,
  handler: (req: ExternalAPIRequest) => Promise<Response>,
  requiredScopes: string[] = []
): Promise<Response> {
  const startTime = Date.now()
  
  try {
    // Authenticate the request
    const authContext = await externalAPIAuth.authenticate(request)
    
    // Check if authenticated
    if (!authContext.isAuthenticated) {
      return createErrorResponse('Unauthorized: Invalid or missing API key', 401)
    }

    // Check required scopes
    for (const scope of requiredScopes) {
      if (!externalAPIAuth.hasScope(authContext, scope)) {
        return createErrorResponse(`Forbidden: Missing required scope '${scope}'`, 403)
      }
    }

    // Add auth context to request
    const authRequest = request as ExternalAPIRequest
    authRequest.auth = authContext

    // Execute the handler
    const response = await handler(authRequest)
    
    // Add rate limit headers
    const responseWithHeaders = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-RateLimit-Limit': authContext.apiKey?.rate_limit.toString() || '0',
        'X-RateLimit-Remaining': authContext.rateLimitRemaining.toString(),
        'X-RateLimit-Reset': (Date.now() + 60000).toString()
      }
    })

    // Log the request
    if (authContext.apiKey) {
      const responseTime = Date.now() - startTime
      await externalAPIAuth.logRequest(
        authContext.apiKey.id,
        request.method,
        request.nextUrl.pathname,
        response.status,
        responseTime
      )
    }

    return responseWithHeaders
  } catch (error) {
    console.error('External API middleware error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * CORS middleware for external API requests
 */
export function withCORS(response: Response): Response {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      ...corsHeaders
    }
  })
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleOPTIONS(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

/**
 * Validate request body against schema
 */
export function validateRequestBody(
  body: any,
  schema: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check required fields
  for (const [field, config] of Object.entries(schema)) {
    if (config.required && (body[field] === undefined || body[field] === null)) {
      errors.push(`Missing required field: ${field}`)
    }
    
    // Type validation
    if (body[field] !== undefined && config.type) {
      const actualType = typeof body[field]
      if (actualType !== config.type) {
        errors.push(`Field '${field}' must be of type ${config.type}, got ${actualType}`)
      }
    }
    
    // String length validation
    if (config.minLength && body[field] && body[field].length < config.minLength) {
      errors.push(`Field '${field}' must be at least ${config.minLength} characters`)
    }
    
    if (config.maxLength && body[field] && body[field].length > config.maxLength) {
      errors.push(`Field '${field}' must be no more than ${config.maxLength} characters`)
    }
    
    // Enum validation
    if (config.enum && body[field] && !config.enum.includes(body[field])) {
      errors.push(`Field '${field}' must be one of: ${config.enum.join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Parse pagination parameters
 */
export function parsePagination(request: NextRequest): {
  page: number
  limit: number
  offset: number
} {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Rate limiting decorator
 */
export function withRateLimit(
  handler: (req: ExternalAPIRequest) => Promise<Response>,
  customLimit?: number
) {
  return async (req: ExternalAPIRequest): Promise<Response> => {
    // Rate limiting is handled in the auth middleware
    // This is a placeholder for additional rate limiting logic
    return handler(req)
  }
}