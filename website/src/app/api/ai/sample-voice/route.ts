import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/dual-auth'

export async function GET(request: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(request)
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const voice = searchParams.get('voice') || 'nova'
  const text = searchParams.get('text') || 'This is a short sample of the selected voice.'

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
  }

  try {
    console.log('🔊 /api/ai/sample-voice: sampling', { voice })
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: `OpenAI TTS failed: ${errText}` }, { status: 500 })
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log('✅ /api/ai/sample-voice: sample ok', { voice })
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline; filename="sample.mp3"'
      }
    })
  } catch (error) {
    console.error('❌ /api/ai/sample-voice: failed', error)
    return NextResponse.json({ error: 'Voice sampling failed' }, { status: 500 })
  }
}


