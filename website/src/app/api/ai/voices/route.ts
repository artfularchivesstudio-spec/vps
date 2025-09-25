import { NextResponse } from 'next/server'

// OpenAI does not currently expose a public voices listing endpoint.
// Maintain a curated list here to keep UX predictable and up to date.
// These IDs must match the `voice` parameter accepted by gpt-4o-mini-tts.

const OPENAI_VOICES = [
  { id: 'alloy', label: 'Alloy', gender: 'male', tags: ['neutral', 'clear'], languages: ['en'] },
  { id: 'aria', label: 'Aria', gender: 'female', tags: ['warm', 'clear'], languages: ['en'] },
  { id: 'ballad', label: 'Ballad', gender: 'male', tags: ['narrative', 'deep'], languages: ['en'] },
  { id: 'verse', label: 'Verse', gender: 'female', tags: ['narrative', 'soft'], languages: ['en'] },
  { id: 'coral', label: 'Coral', gender: 'female', tags: ['crisp', 'bright'], languages: ['en'] },
  { id: 'fable', label: 'Fable', gender: 'male', tags: ['storyteller', 'measured'], languages: ['en'] },
  { id: 'nova', label: 'Nova', gender: 'female', tags: ['default', 'balanced'], languages: ['en', 'es', 'hi'] },
  { id: 'sage', label: 'Sage', gender: 'male', tags: ['scholarly', 'calm'], languages: ['en', 'es', 'hi'] },
  { id: 'shimmer', label: 'Shimmer', gender: 'female', tags: ['expressive', 'dynamic'], languages: ['en', 'es', 'hi'] },
  { id: 'amber', label: 'Amber', gender: 'female', tags: ['bright', 'friendly'], languages: ['en'] },
]

export async function GET() {
  return NextResponse.json({ voices: OPENAI_VOICES })
}


