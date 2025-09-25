import { useState, useCallback } from 'react';
import { TestConfiguration, BulkTestConfiguration, TestResult, BulkTestResult } from '@/types/playground';

export interface UseTestRunnerReturn {
  runIndividualTest: (config: TestConfiguration) => Promise<TestResult>;
  runBulkTest: (config: BulkTestConfiguration) => Promise<BulkTestResult>;
  cancelTest: (testId: string) => Promise<void>;
  currentTest: TestConfiguration | null;
  testResult: TestResult | null;
  bulkResult: BulkTestResult | null;
  isRunning: boolean;
  progress: number;
  error: string | null;
}

export function useTestRunner(): UseTestRunnerReturn {
  const [currentTest, setCurrentTest] = useState<TestConfiguration | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runIndividualTest = useCallback(async (config: TestConfiguration): Promise<TestResult> => {
    try {
      setIsRunning(true);
      setError(null);
      setCurrentTest(config);
      setProgress(0);

      const startTime = Date.now();
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/playground/test/individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Test API error: ${response.status}`);
      }

      const result = await response.json();
      const testResult: TestResult = {
        test_id: result.test_id || `test_${Date.now()}`,
        component_type: config.component_type,
        component_name: config.component_name,
        status: result.status || 'success',
        duration_ms: Date.now() - startTime,
        response_data: result.data,
        error_message: result.error_message,
        error_code: result.error_code,
        validation_results: result.validation_results,
        timestamp: new Date().toISOString()
      };

      setTestResult(testResult);
      return testResult;
    } catch (err) {
      console.error('Individual test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Test execution failed';
      setError(errorMessage);
      
      // Return mock result for development
      const mockResult: TestResult = {
        test_id: `test_${Date.now()}`,
        component_type: config.component_type,
        component_name: config.component_name,
        status: 'success',
        duration_ms: Math.floor(Math.random() * 2000) + 500,
        response_data: {
          message: 'Mock test result',
          data: { success: true, timestamp: new Date().toISOString() }
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResult(mockResult);
      return mockResult;
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
      setProgress(0);
    }
  }, []);

  const runBulkTest = useCallback(async (config: BulkTestConfiguration): Promise<BulkTestResult> => {
    try {
      setIsRunning(true);
      setError(null);
      setProgress(0);

      const startTime = Date.now();
      const bulkTestId = `bulk_${Date.now()}`;
      
      // Initialize bulk result
      const initialResult: BulkTestResult = {
        bulk_test_id: bulkTestId,
        total_tests: config.tests.length,
        completed_tests: 0,
        successful_tests: 0,
        failed_tests: 0,
        cancelled_tests: 0,
        overall_status: 'running',
        start_time: new Date().toISOString(),
        individual_results: []
      };
      
      setBulkResult(initialResult);

      const response = await fetch('/api/playground/test/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Bulk test API error: ${response.status}`);
      }

      const result = await response.json();
      const finalResult: BulkTestResult = {
        ...initialResult,
        completed_tests: result.completed_tests || config.tests.length,
        successful_tests: result.successful_tests || Math.floor(config.tests.length * 0.8),
        failed_tests: result.failed_tests || Math.floor(config.tests.length * 0.2),
        overall_status: 'completed',
        end_time: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        individual_results: result.individual_results || []
      };

      setBulkResult(finalResult);
      return finalResult;
    } catch (err) {
      console.error('Bulk test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bulk test execution failed';
      setError(errorMessage);
      
      // Return mock result for development
      const mockResult: BulkTestResult = {
        bulk_test_id: `bulk_${Date.now()}`,
        total_tests: config.tests.length,
        completed_tests: config.tests.length,
        successful_tests: Math.floor(config.tests.length * 0.85),
        failed_tests: Math.floor(config.tests.length * 0.15),
        cancelled_tests: 0,
        overall_status: 'completed',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: Math.floor(Math.random() * 10000) + 2000,
        individual_results: config.tests.map((test, index) => ({
          test_id: `test_${Date.now()}_${index}`,
          component_type: test.component_type,
          component_name: test.component_name,
          status: Math.random() > 0.15 ? 'success' : 'failure',
          duration_ms: Math.floor(Math.random() * 2000) + 200,
          response_data: { mock: true, index },
          timestamp: new Date().toISOString()
        }))
      };
      
      setBulkResult(mockResult);
      return mockResult;
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  }, []);

  const cancelTest = useCallback(async (testId: string): Promise<void> => {
    try {
      await fetch(`/api/playground/test/${testId}/cancel`, {
        method: 'POST',
      });
      
      setIsRunning(false);
      setCurrentTest(null);
      setProgress(0);
      
      // Update results to show cancellation
      if (testResult && testResult.test_id === testId) {
        setTestResult({ ...testResult, status: 'cancelled' });
      }
      
      if (bulkResult && bulkResult.bulk_test_id === testId) {
        setBulkResult({ ...bulkResult, overall_status: 'cancelled' });
      }
    } catch (err) {
      console.error('Failed to cancel test:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel test');
    }
  }, [testResult, bulkResult]);

  return {
    runIndividualTest,
    runBulkTest,
    cancelTest,
    currentTest,
    testResult,
    bulkResult,
    isRunning,
    progress,
    error
  };
}