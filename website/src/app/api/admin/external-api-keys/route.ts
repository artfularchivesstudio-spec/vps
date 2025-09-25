import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { randomBytes, createHash } from 'crypto'

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 })
}

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_API_SECRET
  const provided = req.headers.get('x-admin-secret') || req.headers.get('X-Admin-Secret')

  if (!adminSecret) {
    return NextResponse.json({ success: false, error: 'Server missing ADMIN_API_SECRET' }, { status: 500 })
  }
  if (!provided || provided !== adminSecret) {
    return unauthorized('Missing or invalid X-Admin-Secret header')
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const name: string = body?.name || 'chatgpt-actions'
  const scopes: string[] = Array.isArray(body?.scopes) && body.scopes.length
    ? body.scopes
    : ['posts:read', 'posts:write', 'ai:analyze', 'ai:generate-audio']
  const rateLimit: number = Number.isFinite(body?.rate_limit) ? Number(body.rate_limit) : 100
  const expiresInDays: number | undefined = Number.isFinite(body?.expires_in_days) ? Number(body.expires_in_days) : undefined
  const createdBy: string | null = typeof body?.created_by === 'string' ? body.created_by : null

  const apiKey = 'aa_' + randomBytes(24).toString('hex')
  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('external_api_keys')
      .insert({
        name,
        key_hash: keyHash,
        scopes,
        rate_limit: rateLimit,
        expires_at: expiresAt,
        created_by: createdBy,
        is_active: true
      })
      .select('id, name, scopes, rate_limit, expires_at, is_active')
      .single()

    if (error) {
      console.error('[create-external-api-key] DB error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        scopes: data.scopes,
        rate_limit: data.rate_limit,
        expires_at: data.expires_at,
        is_active: data.is_active,
        api_key: apiKey
      }
    }, { status: 200 })
  } catch (e) {
    console.error('[create-external-api-key] Unexpected error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

