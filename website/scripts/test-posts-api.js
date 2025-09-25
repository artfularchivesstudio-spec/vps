// Test script for the GET /posts Supabase Edge Function

const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/posts`;
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50';

// Test function
async function testGetPosts() {
  console.log('🧪 Testing GET /posts endpoint...');
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    // Test with query parameters
    console.log('\n🔍 Testing with query parameters...');
    const queryResponse = await fetch(`${FUNCTION_URL}?page=1&limit=5&status=published&search=test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Query Response Status:', queryResponse.status);
    const queryData = await queryResponse.json();
    console.log('📦 Query Response Data:', JSON.stringify(queryData, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test without authorization header
async function testUnauthorized() {
  console.log('\n🚫 Testing unauthorized request...');
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Unauthorized Response Status:', response.status);
    const data = await response.json();
    console.log('📦 Unauthorized Response Data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Unauthorized test failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting API tests for GET /posts endpoint\n');
  
  await testGetPosts();
  await testUnauthorized();
  
  console.log('\n✅ Tests completed!');
}

// Execute if run directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}

module.exports = { testGetPosts, testUnauthorized, runTests };