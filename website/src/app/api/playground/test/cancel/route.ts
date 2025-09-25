import { NextRequest, NextResponse } from 'next/server';
import { getRunningTests } from '@/lib/test-cancellation';

// POST /api/playground/test/cancel - Cancel a running test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_id } = body;
    
    if (!test_id) {
      return NextResponse.json(
        { success: false, error: 'test_id is required' },
        { status: 400 }
      );
    }
    
    // Check if test exists and is running
    const runningTests = getRunningTests();
    const testInfo = runningTests.get(test_id);
    
    if (!testInfo) {
      return NextResponse.json(
        { success: false, error: 'Test not found or already completed' },
        { status: 404 }
      );
    }
    
    if (testInfo.cancelled) {
      return NextResponse.json(
        { success: false, error: 'Test already cancelled' },
        { status: 400 }
      );
    }
    
    // Mark test as cancelled
    testInfo.cancelled = true;
    runningTests.set(test_id, testInfo);
    
    // In a real implementation, you would:
    // 1. Send cancellation signal to the test execution process
    // 2. Update the test status in the database
    // 3. Clean up any resources
    
    // Database update disabled for development
    // TODO: Enable database updates in production
    console.log('Test cancelled (mock):', test_id);
    
    // Clean up after a delay
    setTimeout(() => {
      runningTests.delete(test_id);
    }, 30000); // Clean up after 30 seconds
    
    return NextResponse.json({
      success: true,
      message: 'Test cancelled successfully',
      test_id,
      cancelled_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test cancellation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/playground/test/cancel - Get list of cancellable tests
export async function GET() {
  try {
    const runningTests = getRunningTests();
    const cancellableTests = Array.from(runningTests.entries())
      .filter(([_, info]) => !info.cancelled)
      .map(([test_id, info]) => ({
        test_id,
        start_time: new Date(info.startTime).toISOString(),
        duration_ms: Date.now() - info.startTime
      }));
    
    return NextResponse.json({
      success: true,
      running_tests: cancellableTests
    });
    
  } catch (error) {
    console.error('Error fetching running tests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}