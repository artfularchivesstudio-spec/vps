import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { actions, dry_run = false } = body

    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'Invalid request: actions array is required' },
        { status: 400 }
      )
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('content-cleanup', {
      body: {
        actions,
        dry_run
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
    })

    if (error) {
      console.error('Content cleanup function error:', error)
      return NextResponse.json(
        { error: error.message || 'Content cleanup failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Content cleanup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}