#!/usr/bin/env node

// 🎭 The Grand API Testing Theater - Validating Our Magnificent Architecture! ✨
// A comprehensive test suite to ensure our new API endpoints are performing beautifully

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 🎪 Configuration - Our Testing Stage Setup
const CONFIG = {
  baseUrl: process.env.SUPABASE_URL || 'https://tjkpliasdjpgunbhsiza.supabase.co',
  apiKey: process.env.SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  timeout: 30000, // 30 seconds timeout
  retries: 3
};

// 🎨 Test Results Tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// 🎭 HTTP Request Helper - Our Networking Virtuoso
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.serviceKey}`,
        'apikey': CONFIG.apiKey,
        ...options.headers
      },
      timeout: CONFIG.timeout
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            raw: data
          });
        }
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

// 🎪 Test Runner - Our Performance Director
async function runTest(name, testFn) {
  console.log(`\n🎭 Testing: ${name}`);
  try {
    const result = await testFn();
    if (result.success) {
      console.log(`✅ PASSED: ${name}`);
      testResults.passed++;
      testResults.details.push({ name, status: 'PASSED', details: result.details });
    } else {
      console.log(`❌ FAILED: ${name} - ${result.error}`);
      testResults.failed++;
      testResults.errors.push(`${name}: ${result.error}`);
      testResults.details.push({ name, status: 'FAILED', error: result.error });
    }
  } catch (error) {
    console.log(`💥 ERROR: ${name} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`${name}: ${error.message}`);
    testResults.details.push({ name, status: 'ERROR', error: error.message });
  }
}

// 🎵 Audio Jobs API Tests
async function testAudioJobsAPI() {
  const baseUrl = `${CONFIG.baseUrl}/functions/v1`;
  
  // Test 1: List Audio Jobs
  await runTest('Audio Jobs - List', async () => {
    const response = await makeRequest(`${baseUrl}/audio-jobs?limit=5`);
    
    if (response.status !== 200) {
      return { success: false, error: `Expected 200, got ${response.status}` };
    }
    
    if (!response.data.success) {
      return { success: false, error: 'Response success flag is false' };
    }
    
    return { 
      success: true, 
      details: `Found ${response.data.data?.length || 0} audio jobs` 
    };
  });

  // Test 2: Create Audio Job
  let createdJobId = null;
  await runTest('Audio Jobs - Create', async () => {
    const jobData = {
      text_content: 'This is a test audio generation job for our API validation.',
      input_text: 'Test input text',
      config: {
        voice: 'nova',
        personality: 'professional',
        speed: 1.0
      },
      languages: ['en'],
      is_draft: true
    };

    const response = await makeRequest(`${baseUrl}/audio-jobs`, {
      method: 'POST',
      body: jobData
    });
    
    if (response.status !== 201) {
      return { success: false, error: `Expected 201, got ${response.status}` };
    }
    
    if (!response.data.success || !response.data.data?.id) {
      return { success: false, error: 'No job ID returned' };
    }
    
    createdJobId = response.data.data.id;
    return { 
      success: true, 
      details: `Created job with ID: ${createdJobId}` 
    };
  });

  // Test 3: Get Specific Audio Job
  if (createdJobId) {
    await runTest('Audio Jobs - Get by ID', async () => {
      const response = await makeRequest(`${baseUrl}/audio-jobs/${createdJobId}`);
      
      if (response.status !== 200) {
        return { success: false, error: `Expected 200, got ${response.status}` };
      }
      
      if (!response.data.success || response.data.data?.id !== createdJobId) {
        return { success: false, error: 'Job ID mismatch or missing data' };
      }
      
      return { 
        success: true, 
        details: `Retrieved job ${createdJobId} successfully` 
      };
    });

    // Test 4: Update Audio Job
    await runTest('Audio Jobs - Update', async () => {
      const updateData = {
        config: {
          voice: 'nova',
          personality: 'casual',
          speed: 1.2
        }
      };

      const response = await makeRequest(`${baseUrl}/audio-jobs/${createdJobId}`, {
        method: 'PUT',
        body: updateData
      });
      
      if (response.status !== 200) {
        return { success: false, error: `Expected 200, got ${response.status}` };
      }
      
      return { 
        success: true, 
        details: `Updated job ${createdJobId} successfully` 
      };
    });
  }
}

// 🖼️ Media Assets API Tests
async function testMediaAssetsAPI() {
  const baseUrl = `${CONFIG.baseUrl}/functions/v1`;
  
  // Test 1: List Media Assets
  await runTest('Media Assets - List', async () => {
    const response = await makeRequest(`${baseUrl}/media-assets?limit=5`);
    
    if (response.status !== 200) {
      return { success: false, error: `Expected 200, got ${response.status}` };
    }
    
    if (!response.data.success) {
      return { success: false, error: 'Response success flag is false' };
    }
    
    return { 
      success: true, 
      details: `Found ${response.data.data?.length || 0} media assets` 
    };
  });

  // Test 2: Create Media Asset
  let createdAssetId = null;
  await runTest('Media Assets - Create', async () => {
    const assetData = {
      title: 'Test Audio Asset',
      file_url: 'https://example.com/test-audio.mp3',
      file_type: 'audio',
      mime_type: 'audio/mpeg',
      file_size_bytes: 1024000,
      generation_metadata: {
        type: 'test',
        generated_at: new Date().toISOString()
      }
    };

    const response = await makeRequest(`${baseUrl}/media-assets`, {
      method: 'POST',
      body: assetData
    });
    
    if (response.status !== 201) {
      return { success: false, error: `Expected 201, got ${response.status}` };
    }
    
    if (!response.data.success || !response.data.data?.id) {
      return { success: false, error: 'No asset ID returned' };
    }
    
    createdAssetId = response.data.data.id;
    return { 
      success: true, 
      details: `Created asset with ID: ${createdAssetId}` 
    };
  });

  // Test 3: Get Specific Media Asset
  if (createdAssetId) {
    await runTest('Media Assets - Get by ID', async () => {
      const response = await makeRequest(`${baseUrl}/media-assets/${createdAssetId}`);
      
      if (response.status !== 200) {
        return { success: false, error: `Expected 200, got ${response.status}` };
      }
      
      if (!response.data.success || response.data.data?.id !== createdAssetId) {
        return { success: false, error: 'Asset ID mismatch or missing data' };
      }
      
      return { 
        success: true, 
        details: `Retrieved asset ${createdAssetId} successfully` 
      };
    });
  }
}

// 📝 Posts API Tests
async function testPostsAPI() {
  const baseUrl = `${CONFIG.baseUrl}/functions/v1`;
  
  // Test 1: List Posts
  await runTest('Posts - List', async () => {
    const response = await makeRequest(`${baseUrl}/posts-simple?limit=5`);
    
    if (response.status !== 200) {
      return { success: false, error: `Expected 200, got ${response.status}` };
    }
    
    return { 
      success: true, 
      details: `Posts API responding correctly` 
    };
  });
}

// 🎪 Health Check Tests
async function testHealthChecks() {
  const baseUrl = `${CONFIG.baseUrl}/functions/v1`;
  
  const endpoints = [
    'health-check',
    'debug-env'
  ];

  for (const endpoint of endpoints) {
    await runTest(`Health Check - ${endpoint}`, async () => {
      const response = await makeRequest(`${baseUrl}/${endpoint}`);
      
      if (response.status !== 200) {
        return { success: false, error: `Expected 200, got ${response.status}` };
      }
      
      return { 
        success: true, 
        details: `${endpoint} is healthy` 
      };
    });
  }
}

// 🎭 Main Test Execution - The Grand Performance
async function runAllTests() {
  console.log('🎭 Welcome to the Grand API Testing Theater! ✨');
  console.log('🎪 Testing our magnificent new API architecture...');
  console.log(`🎯 Base URL: ${CONFIG.baseUrl}`);
  console.log('=' .repeat(60));

  // Validate configuration
  if (!CONFIG.baseUrl || !CONFIG.serviceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // Run all test suites
    await testHealthChecks();
    await testAudioJobsAPI();
    await testMediaAssetsAPI();
    await testPostsAPI();

    // Print final results
    console.log('\n' + '=' .repeat(60));
    console.log('🎭 FINAL TEST RESULTS 🎭');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      testResults.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Detailed results
    console.log('\n📋 DETAILED RESULTS:');
    testResults.details.forEach(result => {
      const icon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${icon} ${result.name}`);
      if (result.details) console.log(`      ${result.details}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });

    // Exit with appropriate code
    const exitCode = testResults.failed > 0 ? 1 : 0;
    console.log(`\n🎪 Testing complete! Exit code: ${exitCode}`);
    
    if (exitCode === 0) {
      console.log('🎉 All tests passed! Our API architecture is performing beautifully! ✨');
    } else {
      console.log('🎭 Some tests failed. Please review the errors above.');
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('💥 Fatal error during testing:', error.message);
    process.exit(1);
  }
}

// 🚀 Launch the testing theater!
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testAudioJobsAPI,
  testMediaAssetsAPI,
  testPostsAPI,
  testHealthChecks
};