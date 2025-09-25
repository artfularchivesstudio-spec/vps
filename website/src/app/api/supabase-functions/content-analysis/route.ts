import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[content-analysis API] Starting request...')
    const supabase = createClient()
    
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('[content-analysis API] Session check:', { hasSession: !!session, error: sessionError })
    
    if (sessionError || !session) {
      console.error('Authentication error:', sessionError)
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Call the Supabase Edge Function
    console.log('[content-analysis API] Calling Supabase function...')
    const { data, error } = await supabase.functions.invoke('content-analysis', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
    
    console.log('[content-analysis API] Function response:', { 
      error: error, 
      hasData: !!data
    })

    if (error) {
      console.error('Content analysis function error:', error)
      return NextResponse.json(
        { error: error.message || 'Content analysis failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Content analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}