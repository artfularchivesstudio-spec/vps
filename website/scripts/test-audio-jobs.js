// Test script for the GET /audio-jobs Supabase Edge Function

const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/audio-jobs`;
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50';

async function testListAudioJobs() {
    console.log('🎭 Testing GET /audio-jobs endpoint...');
    
    try {
        // Test 1: Basic list request
        console.log('\n1. Testing basic list request...');
        const response1 = await fetch(`${FUNCTION_URL}?limit=5`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result1 = await response1.json();
        console.log('Status:', response1.status);
        console.log('Response:', JSON.stringify(result1, null, 2));
        
        // Test 2: Filter by status
        console.log('\n2. Testing status filter...');
        const response2 = await fetch(`${FUNCTION_URL}?status=pending&limit=3`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result2 = await response2.json();
        console.log('Status:', response2.status);
        console.log('Response:', JSON.stringify(result2, null, 2));
        
        // Test 3: Pagination
        console.log('\n3. Testing pagination...');
        const response3 = await fetch(`${FUNCTION_URL}?limit=2&offset=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result3 = await response3.json();
        console.log('Status:', response3.status);
        console.log('Response:', JSON.stringify(result3, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testListAudioJobs();