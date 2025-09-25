declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const voice = url.searchParams.get('voice') || 'nova'
    const text = url.searchParams.get('text') || 'This is a short sample of the selected voice.'

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: text })
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(JSON.stringify({ error: `OpenAI TTS failed: ${errText}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const arrayBuffer = await response.arrayBuffer()
    return new Response(arrayBuffer, { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Voice sampling failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})


