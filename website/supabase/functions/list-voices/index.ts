// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
// 🚫 Authentication disabled for pre-prod; voices speak to all 🎙️

const VOICES = [
  { id: 'nova', label: 'Nova', gender: 'female', tags: ['default', 'balanced'], languages: ['en','es','hi'] },
  { id: 'sage', label: 'Sage', gender: 'male', tags: ['scholarly', 'calm'], languages: ['en','es','hi'] },
  { id: 'shimmer', label: 'Shimmer', gender: 'female', tags: ['expressive', 'dynamic'], languages: ['en','es','hi'] },
  { id: 'fable', label: 'Fable', gender: 'male', tags: ['storyteller'], languages: ['en'] },
  { id: 'alloy', label: 'Alloy', gender: 'male', tags: ['neutral', 'clear'], languages: ['en'] },
  { id: 'aria', label: 'Aria', gender: 'female', tags: ['warm', 'clear'], languages: ['en'] },
  { id: 'ballad', label: 'Ballad', gender: 'male', tags: ['narrative', 'deep'], languages: ['en'] },
  { id: 'verse', label: 'Verse', gender: 'female', tags: ['narrative', 'soft'], languages: ['en'] },
]

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = { voices: VOICES }
    return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})


