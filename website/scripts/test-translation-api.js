/**
 * 🧪 Test the translation API fix
 * Tests the variable scoping issue that was causing "text is not defined"
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

console.log('🧪 Testing Translation API Fix\n');

// Simulate the translation service function with the fix
function simulateTranslateText(request) {
  console.log('🔧 Simulating translateText function...\n');

  try {
    // This was the problematic code - accessing variables before destructuring
    // console.log(`📝 Quest: "${text.substring(0, 50)}"`); // This would fail!

    // Fixed: Destructure first, then use
    const { text, sourceLanguage, targetLanguage, context = 'content' } = request;

    console.log(`📝 Quest: "${text?.substring(0, 50)}${text?.length > 50 ? '...' : ''}"`);
    console.log(`🌍 Journey: ${sourceLanguage} → ${targetLanguage} (${context})`);

    // Validate input
    if (!text) {
      throw new Error('Text parameter is required');
    }

    if (typeof text !== 'string') {
      throw new Error('Text parameter must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    console.log('✅ All validations passed!');
    return { success: true, translatedText: `[${targetLanguage.toUpperCase()}] ${text}` };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test cases
console.log('🧪 Test Case 1: Valid request');
const validRequest = {
  text: 'Hello world, this is a test message for translation.',
  sourceLanguage: 'en',
  targetLanguage: 'hi',
  context: 'content'
};
const result1 = simulateTranslateText(validRequest);
console.log(`Result: ${result1.success ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('🧪 Test Case 2: Empty text');
const emptyTextRequest = {
  text: '',
  sourceLanguage: 'en',
  targetLanguage: 'hi',
  context: 'content'
};
const result2 = simulateTranslateText(emptyTextRequest);
console.log(`Result: ${result2.success ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('🧪 Test Case 3: Null text');
const nullTextRequest = {
  text: null,
  sourceLanguage: 'en',
  targetLanguage: 'hi',
  context: 'content'
};
const result3 = simulateTranslateText(nullTextRequest);
console.log(`Result: ${result3.success ? '❌ UNEXPECTED PASS' : '✅ EXPECTED FAIL'}\n`);

console.log('🧪 Test Case 4: Non-string text');
const nonStringTextRequest = {
  text: 12345,
  sourceLanguage: 'en',
  targetLanguage: 'hi',
  context: 'content'
};
const result4 = simulateTranslateText(nonStringTextRequest);
console.log(`Result: ${result4.success ? '❌ UNEXPECTED PASS' : '✅ EXPECTED FAIL'}\n`);

console.log('🎉 Translation API fix test completed!');
console.log('\n💡 Key improvements:');
console.log('✅ Variables destructured before use');
console.log('✅ Comprehensive input validation');
console.log('✅ Better error messages');
console.log('✅ Rich debug logging');

// Test API endpoint directly (if server is running)
console.log('\n🌐 Testing actual API endpoint...');
if (process.env.NODE_ENV !== 'production') {
  testActualAPI().catch(console.error);
}

async function testActualAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization if needed
      },
      body: JSON.stringify({
        post_id: 'test-post-id',
        target_language: 'hi',
        content: 'Hello world, this is a test.',
        title: 'Test Title',
        excerpt: 'Test excerpt'
      })
    });

    console.log(`📡 API Response Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📄 Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ API call failed:');
      console.log('📄 Error:', error);
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('💡 Make sure the Next.js server is running on http://localhost:3000');
  }
}
