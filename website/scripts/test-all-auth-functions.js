#!/usr/bin/env node

/**
 * Comprehensive test script for all Supabase functions with authentication
 * Tests all the functions that were updated with authentication middleware
 */

const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.functions.supabase.co';
const API_KEY = 'chatgpt-actions-key-2025-SmL72KtB5WzgVbU'; // Correct ChatGPT Actions API key

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
  'X-API-Key': API_KEY
};

async function testFunction(name, endpoint, method = 'GET', body = null) {
  console.log(`\n🧪 Testing ${name}...`);
  
  try {
    const options = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${SUPABASE_URL}${endpoint}`, options);
    const data = await response.text();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
    
    if (response.status === 200 || response.status === 201 || response.status === 202) {
      console.log(`   ✅ ${name} - PASSED`);
      return true;
    } else if (response.status === 401) {
      console.log(`   ❌ ${name} - FAILED (Unauthorized)`);
      return false;
    } else if (response.status === 404 && (name.includes('job-status') || name.includes('job-update'))) {
      console.log(`   ✅ ${name} - PASSED (404 expected for dummy job ID)`);
      return true;
    } else {
      console.log(`   ⚠️  ${name} - Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${name} - ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive authentication tests for all Supabase functions\n');
  
  const results = [];
  
  // Test 1: list-voices (already working)
  results.push(await testFunction('list-voices', '/list-voices'));
  
  // Test 2: generate-blog-content (already working)
  results.push(await testFunction('generate-blog-content', '/generate-blog-content', 'POST', {
    analysis: 'Test analysis content',
    language: 'en'
  }));
  
  // Test 3: ai-generate-audio-simple
  results.push(await testFunction('ai-generate-audio-simple', '/ai-generate-audio-simple', 'POST', {
    text: 'Hello, this is a test audio generation.'
  }));
  
  // Test 4: audio-job-submit
  results.push(await testFunction('audio-job-submit', '/audio-job-submit', 'POST', {
    text: 'Test audio job submission',
    languages: ['en'],
    is_draft: true
  }));
  
  // Test 5: audio-job-status (needs a job ID, so we'll test with a dummy ID)
  results.push(await testFunction('audio-job-status', '/audio-job-status/00000000-0000-0000-0000-000000000000'));
  
  // Test 6: audio-job-update
  results.push(await testFunction('audio-job-update', '/audio-job-update', 'POST', {
    job_id: '00000000-0000-0000-0000-000000000000',
    text_content: 'Updated test content'
  }));
  
  // Test 7: audio-jobs (list)
  results.push(await testFunction('audio-jobs', '/audio-jobs'));
  
  // Test 8: ai-analyze-image-simple
  results.push(await testFunction('ai-analyze-image-simple', '/ai-analyze-image-simple', 'POST', {
    image_url: 'https://example.com/test-image.jpg'
  }));
  
  // Test 9: posts-simple
  results.push(await testFunction('posts-simple', '/posts-simple'));
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results Summary:`);
  console.log(`   ✅ Passed: ${passed}/${total}`);
  console.log(`   ❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log(`\n🎉 All tests passed! Authentication is working correctly for all functions.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please check the authentication setup for the failed functions.`);
  }
}

// Run the tests
runAllTests().catch(console.error);