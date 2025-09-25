// In-memory store for tracking running tests (in production, use Redis or database)
const runningTests = new Map<string, { cancelled: boolean; startTime: number }>();

// Helper function to register a running test (to be called from other test endpoints)
export function registerRunningTest(test_id: string): void {
  runningTests.set(test_id, {
    cancelled: false,
    startTime: Date.now()
  });
}

// Helper function to check if a test is cancelled
export function isTestCancelled(test_id: string): boolean {
  const testInfo = runningTests.get(test_id);
  return testInfo?.cancelled || false;
}

// Helper function to unregister a completed test
export function unregisterTest(test_id: string): void {
  runningTests.delete(test_id);
}

// Get the running tests Map for internal operations
export function getRunningTests(): Map<string, { cancelled: boolean; startTime: number }> {
  return runningTests;
}