declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Get all environment variables (filter out sensitive ones)
  const env = {} as Record<string, string>
  
  // Common environment variables
  const envVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_DB_URL',
    'OPENAI_API_KEY',
    'OPENAI_TTS_API_KEY',
    'ANTHROPIC_API_KEY',
    'CLAUDE_API_KEY',
    'ELEVENLABS_API_KEY'
  ]
  
  envVars.forEach(key => {
    const value = Deno.env.get(key)
    if (value) {
      // Mask sensitive values
      if (key.includes('KEY') || key.includes('SECRET')) {
        env[key] = value.substring(0, 10) + '...[MASKED]'
      } else {
        env[key] = value
      }
    } else {
      env[key] = '[NOT SET]'
    }
  })

  const response = {
    success: true,
    message: 'Environment debug info',
    timestamp: new Date().toISOString(),
    environment: env,
    auth_header: req.headers.get('Authorization') || '[NOT PROVIDED]',
    request_info: {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    }
  }

  return new Response(JSON.stringify(response, null, 2), {
    headers: { 
      ...corsHeaders,
      'Content-Type': 'application/json' 
    },
    status: 200
  })
}) 