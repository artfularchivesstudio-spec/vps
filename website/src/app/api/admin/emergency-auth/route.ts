import { emergencyAuthMiddleware } from '@/lib/admin/backup-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🚨 Emergency authentication endpoint called')

    // Try backup authentication
    const backupResult = await emergencyAuthMiddleware(request)

    if (backupResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Emergency authentication successful',
        method: backupResult.method,
        user: {
          id: backupResult.user?.id,
          email: backupResult.user?.email
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Emergency authentication failed',
        error: backupResult.error
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Emergency auth endpoint error:', error)
    return NextResponse.json(
      { error: 'Emergency authentication system error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 Emergency authentication POST called')

    // For POST requests, also check for manual API key in body
    const body = await request.json().catch(() => ({}))
    const manualApiKey = body.apiKey

    if (manualApiKey) {
      // Create a new request with the API key header
      const emergencyRequest = new Request(request.url, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-test-api-key': manualApiKey
        },
        body: JSON.stringify(body)
      })

      const backupResult = await emergencyAuthMiddleware(emergencyRequest)

      if (backupResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Manual emergency authentication successful',
          method: backupResult.method,
          user: {
            id: backupResult.user?.id,
            email: backupResult.user?.email
          }
        })
      }
    }

    // Fallback to normal emergency auth
    const backupResult = await emergencyAuthMiddleware(request)

    if (backupResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Emergency authentication successful',
        method: backupResult.method,
        user: {
          id: backupResult.user?.id,
          email: backupResult.user?.email
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Emergency authentication failed',
        error: backupResult.error
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Emergency auth POST endpoint error:', error)
    return NextResponse.json(
      { error: 'Emergency authentication system error' },
      { status: 500 }
    )
  }
}
