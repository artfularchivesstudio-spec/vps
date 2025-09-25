/**
 * 🎭 Demo script for the complete translation system
 * Shows caching, fallback mechanisms, and batch processing
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

console.log('🎭 Translation System Demo\n');

// Simple in-memory cache (mimicking our real cache)
class DemoCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
    console.log(`💾 Cached: ${key.substring(0, 30)}...`);
  }

  size() {
    return this.cache.size;
  }
}

// Mock translation function (simulates OpenAI API)
async function mockTranslate(text, sourceLang, targetLang, shouldFail = false) {
  if (shouldFail) {
    throw new Error('API quota exceeded (simulated)');
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simple mock translations
  const translations = {
    'en-es': {
      'Hello world': 'Hola mundo',
      'The sun is shining': 'El sol está brillando',
      'Beautiful artwork': 'Hermosa obra de arte',
      'Ancient mystery': 'Misterio antiguo'
    },
    'en-hi': {
      'Hello world': 'नमस्ते दुनिया',
      'The sun is shining': 'सूरज चमक रहा है',
      'Beautiful artwork': 'सुंदर कला',
      'Ancient mystery': 'प्राचीन रहस्य'
    }
  };

  const key = `${sourceLang}-${targetLang}`;
  const translation = translations[key]?.[text] || `[${targetLang.toUpperCase()}] ${text}`;

  return {
    translatedText: translation,
    confidence: 0.95,
    tokensUsed: Math.floor(text.length / 4)
  };
}

// Enhanced translation function with caching and fallback
async function translateWithCache(cache, text, sourceLang, targetLang, forceFail = false) {
  const cacheKey = `${sourceLang}-${targetLang}-${text}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && !forceFail) {
    console.log(`🎯 Cache hit! Using cached translation`);
    return { ...cached, fromCache: true };
  }

  console.log(`🌐 Calling translation API...`);
  try {
    const result = await mockTranslate(text, sourceLang, targetLang, forceFail);
    cache.set(cacheKey, result);
    return { ...result, fromCache: false };

  } catch (error) {
    console.log(`❌ API failed: ${error.message}`);
    console.log(`⚠️  Falling back to mock translation`);

    // Fallback translation
    const fallback = `[${targetLang.toUpperCase()}] ${text}`;
    const fallbackResult = {
      translatedText: fallback,
      confidence: 0.0,
      tokensUsed: 0
    };

    // Cache the fallback (with shorter TTL if we had a real cache)
    cache.set(cacheKey, fallbackResult);
    return { ...fallbackResult, fromCache: false, fallback: true };
  }
}

// Demo scenarios
async function runDemo() {
  const cache = new DemoCache();

  console.log('🚀 Translation System Demo Scenarios\n');
  console.log('='.repeat(50));

  // Scenario 1: Normal successful translation
  console.log('1️⃣ Scenario 1: Normal successful translation');
  console.log('📝 Text: "Hello world"');
  console.log('🌍 Target: Spanish (es)');

  const result1 = await translateWithCache(cache, 'Hello world', 'en', 'es');
  console.log(`✅ Result: "${result1.translatedText}"`);
  console.log(`📊 From cache: ${result1.fromCache}`);
  console.log(`🎯 Confidence: ${result1.confidence}`);
  console.log('');

  // Scenario 2: Cache hit
  console.log('2️⃣ Scenario 2: Cache hit (same translation request)');
  console.log('📝 Text: "Hello world"');
  console.log('🌍 Target: Spanish (es)');

  const result2 = await translateWithCache(cache, 'Hello world', 'en', 'es');
  console.log(`✅ Result: "${result2.translatedText}"`);
  console.log(`📊 From cache: ${result2.fromCache}`);
  console.log(`⚡ Performance: Instant (cached)`);
  console.log('');

  // Scenario 3: API failure with fallback
  console.log('3️⃣ Scenario 3: API failure with fallback');
  console.log('📝 Text: "Beautiful artwork"');
  console.log('🌍 Target: Hindi (hi)');
  console.log('💥 Simulating API quota exceeded...');

  const result3 = await translateWithCache(cache, 'Beautiful artwork', 'en', 'hi', true);
  console.log(`✅ Result: "${result3.translatedText}"`);
  console.log(`📊 From cache: ${result3.fromCache}`);
  console.log(`⚠️  Used fallback: ${result3.fallback || false}`);
  console.log('');

  // Scenario 4: Batch processing
  console.log('4️⃣ Scenario 4: Batch processing multiple translations');

  const batchItems = [
    { text: 'The sun is shining', targetLang: 'es' },
    { text: 'Ancient mystery', targetLang: 'hi' },
    { text: 'Hello world', targetLang: 'es' } // This should be cached
  ];

  console.log(`📦 Processing ${batchItems.length} items...`);

  let totalTokens = 0;
  let cacheHits = 0;

  for (let i = 0; i < batchItems.length; i++) {
    const item = batchItems[i];
    console.log(`  🔄 Item ${i + 1}: "${item.text}" -> ${item.targetLang.toUpperCase()}`);

    const result = await translateWithCache(cache, item.text, 'en', item.targetLang);
    totalTokens += result.tokensUsed || 0;

    if (result.fromCache) cacheHits++;

    console.log(`    ✅ "${result.translatedText}" (${result.fromCache ? 'cached' : 'API'})`);
  }

  console.log(`📊 Batch Summary:`);
  console.log(`   🎯 Cache hits: ${cacheHits}/${batchItems.length}`);
  console.log(`   📊 Total tokens used: ${totalTokens}`);
  console.log(`   💾 Cache size: ${cache.size()} entries`);
  console.log('');

  // Scenario 5: Multilingual content creation simulation
  console.log('5️⃣ Scenario 5: Multilingual content creation simulation');
  console.log('📝 Original post content creation...');

  const postContent = {
    title: 'The Art of Light and Shadow',
    content: 'In the dance between light and shadow, we find the true essence of artistic expression.',
    excerpt: 'Exploring the delicate balance between illumination and darkness in visual art.'
  };

  console.log('🌍 Generating translations for all languages...');

  const languages = ['es', 'hi'];
  const translatedContent = {};

  for (const lang of languages) {
    console.log(`\n📝 Translating to ${lang.toUpperCase()}:`);

    const titleResult = await translateWithCache(cache, postContent.title, 'en', lang);
    const contentResult = await translateWithCache(cache, postContent.content, 'en', lang);
    const excerptResult = await translateWithCache(cache, postContent.excerpt, 'en', lang);

    translatedContent[lang] = {
      title: titleResult.translatedText,
      content: contentResult.translatedText,
      excerpt: excerptResult.translatedText,
      fromCache: titleResult.fromCache || contentResult.fromCache || excerptResult.fromCache
    };

    console.log(`  📖 Title: "${titleResult.translatedText}"`);
    console.log(`  📝 Content: "${contentResult.translatedText.substring(0, 50)}..."`);
    console.log(`  📋 Excerpt: "${excerptResult.translatedText}"`);
    console.log(`  📊 Cached: ${translatedContent[lang].fromCache}`);
  }

  console.log(`\n✅ Complete multilingual post created!`);
  console.log(`📊 Final cache size: ${cache.size()} entries`);
  console.log(`💰 Token savings: ${(cacheHits / (batchItems.length + languages.length * 3)) * 100}% cache hit rate`);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Translation System Demo Complete!');
  console.log('\n💡 Key Features Demonstrated:');
  console.log('✅ Intelligent caching for performance');
  console.log('✅ Graceful API failure handling with fallbacks');
  console.log('✅ Batch processing capabilities');
  console.log('✅ Multilingual content creation');
  console.log('✅ Token usage optimization');
}

// Run the demo
runDemo().catch(console.error);
