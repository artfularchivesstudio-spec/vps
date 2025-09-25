// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Simple health check response
  const response = {
    success: true,
    message: 'Edge functions are working! 🚀',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    environment: {
      deno_version: Deno.version.deno,
      typescript_version: Deno.version.typescript,
      v8_version: Deno.version.v8
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