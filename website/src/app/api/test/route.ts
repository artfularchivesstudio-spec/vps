import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🧪 Test API called successfully!')
  return NextResponse.json({
    message: 'Test API is working!',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  console.log('🧪 Test POST API called with body:', body)

  return NextResponse.json({
    message: 'Test POST API is working!',
    received: body,
    timestamp: new Date().toISOString()
  })
}
