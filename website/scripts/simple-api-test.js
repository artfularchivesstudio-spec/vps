#!/usr/bin/env node

// 🎭 Simple API Validation Test - Quick Health Check for Our Architecture! ✨

const https = require('https');
const { URL } = require('url');

// 🎪 Basic Configuration
const BASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1';

// 🎨 Simple HTTP Request Helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 🎭 Test Function
async function testEndpoint(name, url) {
  try {
    console.log(`🎪 Testing ${name}...`);
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      console.log(`✅ ${name}: OK (${response.status})`);
      return true;
    } else if (response.status === 401) {
      console.log(`🔐 ${name}: Authentication required (${response.status}) - Expected for protected endpoints`);
      return true; // This is expected for protected endpoints
    } else {
      console.log(`⚠️  ${name}: Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    return false;
  }
}

// 🎪 Main Test Runner
async function runTests() {
  console.log('🎭 Simple API Health Check Theater! ✨');
  console.log('🎯 Testing basic endpoint availability...');
  console.log('=' .repeat(50));

  const tests = [
    ['Health Check', `${BASE_URL}/health-check`],
    ['Debug Environment', `${BASE_URL}/debug-env`],
    ['Audio Jobs List', `${BASE_URL}/audio-jobs`],
    ['Media Assets List', `${BASE_URL}/media-assets`],
    ['Posts Simple', `${BASE_URL}/posts-simple`],
    ['Posts Function', `${BASE_URL}/posts`]
  ];

  let passed = 0;
  let total = tests.length;

  for (const [name, url] of tests) {
    const success = await testEndpoint(name, url);
    if (success) passed++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🎭 RESULTS 🎭');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📊 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('🎉 All endpoints are responding! Architecture is healthy! ✨');
  } else {
    console.log('🎪 Some endpoints may need attention, but this is normal for protected APIs.');
  }
  
  console.log('\n🎭 Note: Authentication errors (401) are expected and indicate');
  console.log('    that the endpoints are deployed and responding correctly!');
}

// 🚀 Run the tests
runTests().catch(console.error);