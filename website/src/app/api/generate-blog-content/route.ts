import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/dual-auth'

// 📝 Function-level comment: proxies analysis to Supabase for enchanting blog prose ✨📜
export async function POST(request: NextRequest) {
  try {
    // 🔐 Step 0: verify traveler credentials
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // 📦 Step 1: unwrap the analysis payload
    const { analysis } = await request.json()
    if (!analysis) {
      return NextResponse.json({ error: 'No analysis provided' }, { status: 400 })
    }

    const supabase = authResult.supabaseClient
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // 🧠 Step 2: invoke the edge function to conjure content
    const { data, error } = await supabase.functions.invoke('generate-blog-content', {
      headers: { Authorization: `Bearer ${serviceRoleKey}` },
      body: { analysis }
    })

    if (error) {
      console.error('generate-blog-content failed:', error)
      return NextResponse.json({ success: false, error: 'Failed to generate blog content' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...data })
  } catch (err) {
    console.error('generate-blog-content route error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
