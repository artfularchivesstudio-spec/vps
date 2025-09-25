import { emergencyAuthMiddleware } from '@/lib/admin/backup-auth';
import { logger } from '@/lib/observability/logger';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

interface AuthResult {
  isAuthenticated: boolean;
  authType: 'session' | 'api_key' | 'none';
  user?: any;
  supabaseClient: any;
  error?: string;
}

/**
 * Dual authentication system that supports both:
 * 1. Session-based authentication (admin panel users)
 * 2. API key authentication (ChatGPT Actions)
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Check for API key authentication first (ChatGPT Actions)
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-api-key');
  const queryApiKey = new URL(request.url).searchParams.get('api_key');
  
  const providedApiKey = 
    authHeader?.replace('Bearer ', '') || 
    apiKey || 
    queryApiKey;

  // Only log auth debug info if API key authentication is being attempted
  if (authHeader || apiKey || queryApiKey) {
    console.log('🔍 Auth Debug - API Key Headers:', {
      authHeader: authHeader ? 'present' : 'missing',
      apiKey: apiKey ? 'present' : 'missing',
      queryApiKey: queryApiKey ? 'present' : 'missing',
      providedApiKey: providedApiKey ? 'present' : 'missing'
    });
  }

  // If API key is provided, validate it
  if (providedApiKey) {
    const validApiKey = process.env.CHATGPT_ACTIONS_API_KEY || 'chatgpt-actions-key-2025-SmL72KtB5WzgVbU';
    
    if (providedApiKey === validApiKey) {
      await logger.logSuccess('auth_api_key_success', '🔑 API key authentication successful');
      return {
        isAuthenticated: true,
        authType: 'api_key',
        supabaseClient: createServiceClient(), // Use service client for API key auth
      };
    } else {
      await logger.logError({
        type: 'auth_api_key_failed',
        message: '❌ Invalid API key provided',
        severity: 'warning',
        source: 'auth'
      });
      return {
        isAuthenticated: false,
        authType: 'none',
        supabaseClient: createServiceClient(),
        error: 'Invalid API key'
      };
    }
  }

  // If no API key, check for session authentication (admin panel)
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Only log session failure if it's not an expected case (no debugging needed for normal flow)
      return {
        isAuthenticated: false,
        authType: 'none',
        supabaseClient: createServiceClient(),
        error: 'No valid session or API key'
      };
    }

    // Session authentication successful - no need to log for every request
    return {
      isAuthenticated: true,
      authType: 'session',
      user,
      supabaseClient: supabase, // Use regular client for session auth
    };
  } catch (error) {
    await logger.logError({
      type: 'auth_session_error',
      message: '💥 Session authentication error',
      severity: 'error',
      source: 'auth',
      requestData: { error }
    });

    // 🚨 Try backup authentication as last resort
    console.warn('🔄 Normal auth failed, attempting backup authentication...');
    try {
      const backupResult = await emergencyAuthMiddleware(request as any);

      if (backupResult.success) {
        await logger.logSuccess('backup_auth_activated', '🚨 Backup authentication successful in dual-auth', {
          method: backupResult.method,
          userId: backupResult.user?.id
        });

        return {
          isAuthenticated: true,
          authType: backupResult.method as any,
          user: backupResult.user,
          supabaseClient: createServiceClient(),
        };
      }
    } catch (backupError) {
      console.error('Backup auth also failed:', backupError);
    }

    return {
      isAuthenticated: false,
      authType: 'none',
      supabaseClient: createServiceClient(),
      error: 'Authentication error - including backup auth failed'
    };
  }
}

/**
 * Middleware function to add authentication context to request headers
 * This helps distinguish between ChatGPT Actions and admin panel requests
 */
export function addAuthContext(authResult: AuthResult): Record<string, string> {
  return {
    'x-auth-type': authResult.authType,
    'x-auth-status': authResult.isAuthenticated ? 'authenticated' : 'unauthenticated',
    ...(authResult.user && { 'x-user-id': authResult.user.id })
  };
}