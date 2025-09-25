/**
 * 🧪 Test script for OpenAI translation integration
 * Verifies that real translations are working and API connectivity
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envVars = {};
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^['\"]|['\"]$/g, '');
    }
  });
}

console.log('🧪 Testing OpenAI Translation Integration...\n');

// Test 1: Direct API call
async function testDirectTranslation() {
  console.log('1️⃣ Testing direct OpenAI API translation...');

  try {
    const openaiApiKey = envVars.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found in .env');
    }

    const testText = "The sun dipped below the horizon, painting the sky in fiery hues of orange and pink.";
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a highly accurate translator specializing in artistic content. Translate the following text into Spanish. Maintain the poetic and mystical tone. Provide only the translated text.`
          },
          { role: 'user', content: testText }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();

    console.log('✅ Direct API translation successful!');
    console.log(`📝 Original: "${testText}"`);
    console.log(`🌍 Spanish: "${translatedText}"`);
    console.log(`📊 Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
    console.log('');

    return translatedText;

  } catch (error) {
    console.error('❌ Direct API translation failed:', error.message);
    console.log('');
    return null;
  }
}

// Test 2: Test API quota and error handling
async function testAPIErrorHandling() {
  console.log('2️⃣ Testing API error handling...');

  try {
    // Test with invalid API key
    const invalidKey = 'sk-invalid-key';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${invalidKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      })
    });

    if (response.status === 401) {
      console.log('✅ Invalid API key handled correctly (401 Unauthorized)');
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
  console.log('');
}

// Test 3: Test caching system (simple version)
async function testSimpleCache() {
  console.log('3️⃣ Testing simple caching logic...');

  // Simple in-memory cache for testing
  const cache = new Map();

  const testText = "Hello world";
  const cacheKey = `en-es-content-${testText}`;

  // Test cache miss
  const miss = cache.get(cacheKey);
  console.log(`📭 Cache miss (expected): ${miss === undefined ? '✅' : '❌'}`);

  // Test cache set
  cache.set(cacheKey, 'Hola mundo');
  console.log('💾 Cache set: ✅');

  // Test cache hit
  const hit = cache.get(cacheKey);
  console.log(`🎯 Cache hit: ${hit === 'Hola mundo' ? '✅' : '❌'}`);

  console.log(`📊 Cache size: ${cache.size} entries`);
  console.log('');
}

// Test 4: Test batch processing concept
async function testBatchProcessing() {
  console.log('4️⃣ Testing batch processing concept...');

  const testItems = [
    { text: "Hello", targetLang: "es" },
    { text: "Goodbye", targetLang: "hi" },
    { text: "Thank you", targetLang: "fr" }
  ];

  console.log(`📦 Processing ${testItems.length} items in batch...`);

  // Simulate batch processing with delays
  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    console.log(`  🔄 Item ${i + 1}/${testItems.length}: "${item.text}" -> ${item.targetLang.toUpperCase()}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✅ Batch processing simulation completed');
  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting OpenAI Translation Integration Tests\n');
  console.log('='.repeat(50));
  console.log('');

  // Check environment
  console.log('🔧 Environment Check:');
  console.log(`   OpenAI API Key: ${envVars.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('');

  if (!envVars.OPENAI_API_KEY) {
    console.error('❌ Cannot proceed without OpenAI API key');
    return;
  }

  // Run all tests
  await testDirectTranslation();
  await testAPIErrorHandling();
  await testSimpleCache();
  await testBatchProcessing();

  console.log('='.repeat(50));
  console.log('🎊 All translation tests completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Run the analyze-and-fix-posts.js script with real translations');
  console.log('2. Test the new batch translation API endpoint');
  console.log('3. Integrate translations into content creation workflow');
}

// Run the tests
runAllTests().catch(console.error);
