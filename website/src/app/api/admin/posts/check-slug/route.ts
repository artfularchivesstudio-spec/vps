import { NextRequest, NextResponse } from 'next/server'

/**
 * 🔍 Slug Uniqueness Checker - The vigilant guardian of unique URLs
 *
 * "In the grand theatre of content, every slug must be unique,
 * lest the audience wander into the wrong performance!"
 *
 * This endpoint proxies to the posts edge function to check slug uniqueness
 * using the same logic and permissions as the main admin posts API.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // 🎭 Validate the slug parameter
    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: slug',
        data: null
      }, { status: 400 })
    }

    // 🧹 Basic slug validation (should match our slug generation rules)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid slug format',
        data: null
      }, { status: 400 })
    }

    // 🎭 Proxy to edge function - use the same approach as main admin posts API
    const target = `${process.env.SUPABASE_URL}/functions/v1/posts?slug_check=${encodeURIComponent(slug)}`

    console.log(`🔍 Checking slug uniqueness via edge function: ${slug}`)

    const res = await fetch(target, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      console.error(`❌ Edge function returned status ${res.status}`)
      return NextResponse.json({
        success: false,
        error: `Edge function error: ${res.status}`,
        data: null
      }, { status: res.status })
    }

    const data = await res.text()

    try {
      const json = JSON.parse(data)

      // 🎪 Extract slug existence from edge function response
      const slugCheck = json.success && json.data?.slug_check
      const exists = slugCheck?.exists || false

      console.log(`🔍 Slug check result: "${slug}" exists = ${exists}`)

      return NextResponse.json({
        success: true,
        data: {
          exists,
          slug
        },
        error: null
      })

    } catch (parseError) {
      console.error('❌ Failed to parse edge function response:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Failed to parse edge function response',
        data: null
      }, { status: 500 })
    }

  } catch (error) {
    console.error('💥 Unexpected error in slug check:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      data: null
    }, { status: 500 })
  }
}
