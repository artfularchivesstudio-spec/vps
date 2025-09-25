/**
 * Translation Debug Test Script
 * Tests the translation functionality to identify the issue causing the UI to get stuck
 */

const fetch = require('node-fetch');

async function testTranslationAPI() {
  console.log('🧪 Testing Translation API...');

  try {
    // Test the batch translation endpoint
    const response = await fetch('http://localhost:3000/api/ai/translate-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        translations: [
          {
            text: "Hello world",
            target_language: "es",
            context: "title"
          },
          {
            text: "This is a test content",
            target_language: "hi",
            context: "content"
          }
        ],
        source_language: "en"
      })
    });

    if (!response.ok) {
      console.error('❌ API Response Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ API Response:', JSON.stringify(result, null, 2));
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test cache functionality
async function testCache() {
  console.log('🧪 Testing Translation Cache...');

  try {
    // Import the cache (this might fail due to TypeScript)
    const cacheModule = require('./src/lib/ai/translation-cache.ts');
    console.log('Cache loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Cache test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Translation Debug Tests...\n');

  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  const apiTest = await testTranslationAPI();
  const cacheTest = await testCache();

  console.log('\n📊 Test Results:');
  console.log('API Test:', apiTest ? '✅ PASS' : '❌ FAIL');
  console.log('Cache Test:', cacheTest ? '✅ PASS' : '❌ FAIL');

  if (!apiTest || !cacheTest) {
    console.log('\n🔧 Issues found! Check the error messages above.');
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

runTests().catch(console.error);
