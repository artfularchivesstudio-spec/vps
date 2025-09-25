import { NextRequest, NextResponse } from 'next/server';
import { TestConfiguration, TestResult } from '@/types/playground';

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

// POST /api/playground/test/individual - Execute individual component test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config: TestConfiguration = body;
    
    // Validate required fields
    if (!config.component_name || !config.component_type) {
      return NextResponse.json(
        { success: false, error: 'component_name and component_type are required' },
        { status: 400 }
      );
    }
    
    // Set defaults
    const testConfig: TestConfiguration = {
      ...config,
      timeout_ms: config.timeout_ms || 30000,
      retry_count: config.retry_count || 1,
      test_parameters: config.test_parameters || {}
    };
    
    // Execute test with retries
    let lastError: string | null = null;
    let result: TestResult | null = null;
    
    for (let attempt = 0; attempt <= (testConfig.retry_count || 1); attempt++) {
      try {
        result = await executeComponentTest(testConfig);
        
        if (result.status === 'success') {
          break; // Success, no need to retry
        }
        
        lastError = result.error_message || null;
        
        if (attempt < (testConfig.retry_count || 1)) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    if (!result) {
      // All retries failed
      const now = new Date().toISOString();
      result = {
        test_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        component_name: testConfig.component_name,
        component_type: testConfig.component_type,
        status: 'failure',
        duration_ms: testConfig.timeout_ms || 30000,
        timestamp: now,
        response_data: null,
        error_message: lastError || 'Test execution failed',
        error_code: 'EXECUTION_FAILED'
      };
    }
    
    // Save to database (disabled for development)
    // TODO: Enable database saving in production
    console.log('Test result (mock):', result.test_id, result.status);
    
    return NextResponse.json({
      success: true,
      test_id: result.test_id,
      status: result.status,
      duration_ms: result.duration_ms,
      data: result.response_data,
      error_message: result.error_message,
      error_code: result.error_code,
      validation_results: result.validation_results
    });
    
  } catch (error) {
    console.error('Individual test execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}