import { NextRequest, NextResponse } from 'next/server';

// GET /api/playground/test - Get test status and available endpoints
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Playground Test API',
      endpoints: {
        individual: '/api/playground/test/individual',
        bulk: '/api/playground/test/bulk',
        cancel: '/api/playground/test/cancel'
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Test API info error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}