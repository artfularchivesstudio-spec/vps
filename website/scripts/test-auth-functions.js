const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const API_KEY = 'chatgpt-actions-key-2025-SmL72KtB5WzgVbU';

// Test list-voices function with authentication
async function testListVoices() {
  console.log('\n🎤 Testing list-voices function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/list-voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.voices && Array.isArray(data.voices)) {
      console.log('✅ list-voices test PASSED');
      return true;
    } else {
      console.log('❌ list-voices test FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ list-voices test ERROR:', error.message);
    return false;
  }
}

// Test generate-blog-content function
async function testGenerateBlogContent() {
  console.log('\n📝 Testing generate-blog-content function...');
  
  const testAnalysis = 'This is a fascinating ancient artifact from the Roman Empire, discovered in a recent archaeological dig. It appears to be a ceremonial vessel with intricate carvings depicting mythological scenes.';
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-blog-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        analysis: testAnalysis,
        language: 'en'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.blogContent && data.suggestedTitle) {
      console.log('✅ generate-blog-content test PASSED');
      return true;
    } else {
      console.log('❌ generate-blog-content test FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ generate-blog-content test ERROR:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Supabase Functions Authentication...');
  
  const results = {
    listVoices: await testListVoices(),
    generateBlogContent: await testGenerateBlogContent()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log(`list-voices: ${results.listVoices ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`generate-blog-content: ${results.generateBlogContent ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n${allPassed ? '🎉 All tests PASSED!' : '⚠️  Some tests FAILED'}`);
}

runTests().catch(console.error);