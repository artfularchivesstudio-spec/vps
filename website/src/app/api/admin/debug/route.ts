import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug endpoint called')

    // Check environment variables
    const envCheck = {
      TEST_ADMIN_EMAIL: !!process.env.TEST_ADMIN_EMAIL,
      TEST_ADMIN_PASSWORD: !!process.env.TEST_ADMIN_PASSWORD,
      TEST_SUPER_ADMIN_EMAIL: !!process.env.TEST_SUPER_ADMIN_EMAIL,
      TEST_USER_API_KEY: !!process.env.TEST_USER_API_KEY,
      TEST_USER_API_KEY_VALUE: process.env.TEST_USER_API_KEY?.substring(0, 10) + '...'
    }

    // Check headers from request
    const headers = {
      authorization: request.headers.get('authorization') ? 'present' : 'missing',
      'x-api-key': request.headers.get('x-api-key') ? 'present' : 'missing',
      'x-test-api-key': request.headers.get('x-test-api-key') ? 'present' : 'missing',
      'x-test-api-key-value': request.headers.get('x-test-api-key')?.substring(0, 10) + '...'
    }

    // Check API key match
    const requestApiKey = request.headers.get('x-test-api-key') || request.headers.get('x-api-key')
    const envApiKey = process.env.TEST_USER_API_KEY
    const apiKeyMatch = requestApiKey === envApiKey

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      headers,
      apiKeyMatch,
      requestApiKey: requestApiKey?.substring(0, 10) + '...',
      envApiKey: envApiKey?.substring(0, 10) + '...'
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Debug endpoint error', details: errorMessage },
      { status: 500 }
    )
  }
}
