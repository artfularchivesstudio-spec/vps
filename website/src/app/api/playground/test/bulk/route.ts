import { NextRequest, NextResponse } from 'next/server';
import { TestConfiguration, TestResult, BulkTestConfiguration, BulkTestResult } from '@/types/playground';

// Mock test execution for a component
async function executeComponentTest(config: TestConfiguration): Promise<TestResult> {
  const startTime = Date.now();
  
  // Simulate test execution delay
  const executionTime = Math.random() * (config.timeout_ms || 30000) * 0.1 + 500;
  await new Promise(resolve => setTimeout(resolve, executionTime));
  
  // Simulate test results based on component and parameters
  const success = Math.random() > 0.2; // 80% success rate
  const endTime = Date.now();
  
  const result: TestResult = {
    test_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    component_name: config.component_name,
    component_type: config.component_type,
    status: success ? 'success' : 'failure',
    duration_ms: endTime - startTime,
    timestamp: new Date().toISOString(),
    response_data: success ? {
      response: `Test completed successfully for ${config.component_name}`,
      metrics: {
        response_time: endTime - startTime,
        memory_usage: Math.floor(Math.random() * 100 + 50),
        cpu_usage: Math.floor(Math.random() * 50 + 10)
      }
    } : null,
    error_message: success ? undefined : `Test failed for ${config.component_name}: Connection timeout`,
    error_code: success ? undefined : 'TIMEOUT'
  };
  
  return result;
}

// POST /api/playground/test/bulk - Execute bulk component tests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bulkConfig: BulkTestConfiguration = body;
    
    if (!bulkConfig.tests || bulkConfig.tests.length === 0) {
      return NextResponse.json(
        { success: false, error: 'tests array is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    const results: TestResult[] = [];
    const errors: string[] = [];
    
    // Execute tests with concurrency control
    const maxConcurrency = bulkConfig.max_concurrent || 5;
    const batches: TestConfiguration[][] = [];
    
    // Split tests into batches
    for (let i = 0; i < bulkConfig.tests.length; i += maxConcurrency) {
      batches.push(bulkConfig.tests.slice(i, i + maxConcurrency));
    }
    
    // Execute batches sequentially, tests within batch concurrently
    for (const batch of batches) {
      const batchPromises = batch.map(async (config) => {
        try {
          const result = await executeComponentTest(config);
          results.push(result);
          return result;
        } catch (error) {
          const errorMsg = `Failed to test ${config.component_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          
          // Create failed result
          const now = new Date().toISOString();
          const failedResult: TestResult = {
            test_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            component_name: config.component_name,
            component_type: config.component_type,
            status: 'failure',
            duration_ms: 0,
            timestamp: now,
            response_data: null,
            error_message: errorMsg,
            error_code: 'EXECUTION_FAILED'
          };
          results.push(failedResult);
          return failedResult;
        }
      });
      
      await Promise.all(batchPromises);
      
      // Add delay between batches if specified (using timeout_ms as delay)
      if (bulkConfig.timeout_ms && batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.min(bulkConfig.timeout_ms / 10, 1000)));
      }
    }
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // Calculate summary statistics
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failure').length;
    const avgDuration = results.length > 0 ? Math.floor(results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length) : 0;
    
    const bulkResult: BulkTestResult = {
      bulk_test_id: `bulk_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      total_tests: results.length,
      completed_tests: results.length,
      successful_tests: passed,
      failed_tests: failed,
      cancelled_tests: 0,
      overall_status: failed === 0 ? 'completed' : 'failed',
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      duration_ms: totalDuration,
      individual_results: results
    };
    
    // Save results to database (disabled for development)
    // TODO: Enable database saving in production
    console.log('Bulk test results (mock):', bulkResult.bulk_test_id, bulkResult.overall_status);
    
    return NextResponse.json({
      success: true,
      bulk_test_id: bulkResult.bulk_test_id,
      total_tests: bulkResult.total_tests,
      completed_tests: bulkResult.completed_tests,
      successful_tests: bulkResult.successful_tests,
      failed_tests: bulkResult.failed_tests,
      overall_status: bulkResult.overall_status,
      duration_ms: bulkResult.duration_ms,
      individual_results: bulkResult.individual_results
    });
    
  } catch (error) {
    console.error('Bulk test execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}