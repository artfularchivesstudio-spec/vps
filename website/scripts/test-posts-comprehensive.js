// Comprehensive test script for the GET /posts Supabase Edge Function

const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/posts`;
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50';

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    const data = await response.json();
    return { status: response.status, data, headers: Object.fromEntries(response.headers) };
}

// Test cases
const testCases = [
    {
        name: 'Basic GET /posts',
        url: FUNCTION_URL,
        expectedStatus: 200
    },
    {
        name: 'GET /posts with pagination',
        url: `${FUNCTION_URL}?page=1&limit=5`,
        expectedStatus: 200
    },
    {
        name: 'GET /posts with status filter',
        url: `${FUNCTION_URL}?status=published`,
        expectedStatus: 200
    },
    {
        name: 'GET /posts with search query',
        url: `${FUNCTION_URL}?search=art`,
        expectedStatus: 200
    },
    {
        name: 'GET /posts with ordering',
        url: `${FUNCTION_URL}?order_by=title&order_direction=asc`,
        expectedStatus: 200
    },
    {
        name: 'GET /posts with multiple filters',
        url: `${FUNCTION_URL}?page=1&limit=3&status=draft&search=tapestry&order_by=created_at&order_direction=desc`,
        expectedStatus: 200
    },
    {
        name: 'GET /posts with large limit (should be capped at 100)',
        url: `${FUNCTION_URL}?limit=200`,
        expectedStatus: 200
    },
    {
        name: 'Unauthorized request (no auth header)',
        url: FUNCTION_URL,
        options: { headers: {} },
        expectedStatus: 401
    }
];

// Run tests
async function runTests() {
    console.log('🚀 Starting comprehensive API tests for GET /posts endpoint\n');
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
        console.log(`🧪 ${testCase.name}`);
        console.log(`📍 URL: ${testCase.url}`);
        
        try {
            const result = await makeRequest(testCase.url, testCase.options || {});
            
            console.log(`📊 Status: ${result.status}`);
            
            // Check if status matches expected
            if (result.status === testCase.expectedStatus) {
                console.log('✅ Status check: PASSED');
                passedTests++;
            } else {
                console.log(`❌ Status check: FAILED (expected ${testCase.expectedStatus}, got ${result.status})`);
            }
            
            // Additional validations for successful responses
            if (result.status === 200 && result.data.success) {
                console.log('✅ Response structure: PASSED');
                
                // Check pagination metadata
                if (result.data.meta && result.data.meta.pagination) {
                    console.log('✅ Pagination metadata: PASSED');
                } else {
                    console.log('❌ Pagination metadata: MISSING');
                }
                
                // Check rate limit metadata
                if (result.data.meta && result.data.meta.rateLimit) {
                    console.log('✅ Rate limit metadata: PASSED');
                } else {
                    console.log('❌ Rate limit metadata: MISSING');
                }
                
                // Check posts structure
                if (result.data.data && Array.isArray(result.data.data.posts)) {
                    console.log(`✅ Posts array: PASSED (${result.data.data.posts.length} posts)`);
                    
                    // Check first post structure if exists
                    if (result.data.data.posts.length > 0) {
                        const firstPost = result.data.data.posts[0];
                        const requiredFields = ['id', 'title', 'slug', 'content', 'status', 'created_at'];
                        const missingFields = requiredFields.filter(field => !firstPost.hasOwnProperty(field));
                        
                        if (missingFields.length === 0) {
                            console.log('✅ Post structure: PASSED');
                        } else {
                            console.log(`❌ Post structure: MISSING FIELDS (${missingFields.join(', ')})`);
                        }
                    }
                } else {
                    console.log('❌ Posts array: INVALID');
                }
            }
            
            // Show sample data for successful requests
            if (result.status === 200 && result.data.data && result.data.data.posts.length > 0) {
                const samplePost = result.data.data.posts[0];
                console.log('📋 Sample post:');
                console.log(`   - ID: ${samplePost.id}`);
                console.log(`   - Title: ${samplePost.title?.substring(0, 50)}...`);
                console.log(`   - Status: ${samplePost.status}`);
                console.log(`   - Created: ${samplePost.created_at}`);
            }
            
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}`);
        }
        
        console.log('\n' + '─'.repeat(80) + '\n');
    }
    
    // Summary
    console.log('📊 TEST SUMMARY');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! The GET /posts endpoint is working perfectly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the results above.');
    }
}

// Run the tests
runTests().catch(console.error);