import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Serves the ChatGPT Actions OpenAPI spec, injecting the Vercel protection bypass token from env.
export async function GET(_req: NextRequest) {
  try {
    const token = process.env.VERCEL_PROTECTION_BYPASS
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'VERCEL_PROTECTION_BYPASS env var is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Prefer the repo spec with placeholders; fallback to public copy if needed.
    const candidates = [
      path.join(process.cwd(), 'openapi-chatgpt-actions.yaml'),
      path.join(process.cwd(), 'public', 'openapi-chatgpt-actions.yaml'),
    ]

    let yaml = ''
    let lastErr: unknown = null
    for (const file of candidates) {
      try {
        yaml = await fs.readFile(file, 'utf8')
        if (yaml) break
      } catch (err) {
        lastErr = err
      }
    }

    if (!yaml) {
      return new Response(
        JSON.stringify({ error: 'Failed to load OpenAPI spec', details: String(lastErr || '') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Inject the token by replacing the placeholder anywhere it appears.
    const rendered = yaml.replace(/ENV_VERCEL_PROTECTION_BYPASS/g, token)

    return new Response(rendered, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to render OpenAPI spec', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

