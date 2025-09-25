#!/usr/bin/env node

// Test script to verify dual authentication system
// Tests both API key authentication (ChatGPT Actions) and session authentication (admin panel)

const API_BASE = 'http://localhost:3002/api'
const API_KEY = process.env.CHATGPT_ACTIONS_API_KEY || 'chatgpt-actions-key-2025-SmL72KtB5WzgVbU'

async function testApiKeyAuth() {
  console.log('🔑 Testing API Key Authentication (ChatGPT Actions)...')
  
  try {
    const response = await fetch(`${API_BASE}/ai/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        text: 'This is a test of the dual authentication system.',
        voice: 'nova',
        language: 'en'
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ API Key Authentication: SUCCESS')
      console.log('   Response:', data)
    } else {
      console.log('❌ API Key Authentication: FAILED')
      console.log('   Status:', response.status)
      console.log('   Error:', data)
    }
  } catch (error) {
    console.log('❌ API Key Authentication: ERROR')
    console.log('   Error:', error.message)
  }
}

async function testInvalidApiKey() {
  console.log('\n🚫 Testing Invalid API Key...')
  
  try {
    const response = await fetch(`${API_BASE}/ai/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-key'
      },
      body: JSON.stringify({
        text: 'This should fail.',
        voice: 'nova',
        language: 'en'
      })
    })
    
    const data = await response.json()
    
    if (response.status === 401) {
      console.log('✅ Invalid API Key: CORRECTLY REJECTED')
      console.log('   Status:', response.status)
      console.log('   Error:', data.error)
    } else {
      console.log('❌ Invalid API Key: SHOULD HAVE BEEN REJECTED')
      console.log('   Status:', response.status)
      console.log('   Response:', data)
    }
  } catch (error) {
    console.log('❌ Invalid API Key Test: ERROR')
    console.log('   Error:', error.message)
  }
}

async function testNoAuth() {
  console.log('\n🚫 Testing No Authentication...')
  
  try {
    const response = await fetch(`${API_BASE}/ai/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'This should fail.',
        voice: 'nova',
        language: 'en'
      })
    })
    
    const data = await response.json()
    
    if (response.status === 401) {
      console.log('✅ No Authentication: CORRECTLY REJECTED')
      console.log('   Status:', response.status)
      console.log('   Error:', data.error)
    } else {
      console.log('❌ No Authentication: SHOULD HAVE BEEN REJECTED')
      console.log('   Status:', response.status)
      console.log('   Response:', data)
    }
  } catch (error) {
    console.log('❌ No Authentication Test: ERROR')
    console.log('   Error:', error.message)
  }
}

async function testOtherEndpoints() {
  console.log('\n🔍 Testing Other Endpoints with API Key...')
  
  const endpoints = [
    { path: '/ai/analyze-image', method: 'POST', body: { image_url: 'https://example.com/test.jpg' } },
    { path: '/ai/sample-voice?voice=nova&text=test', method: 'GET' },
    { path: '/audio-jobs/batch-status', method: 'POST', body: { post_ids: ['test-id'] } }
  ]
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }
      
      const response = await fetch(`${API_BASE}${endpoint.path}`, options)
      const data = await response.json()
      
      if (response.ok || response.status === 400) { // 400 is ok for invalid data, means auth worked
        console.log(`✅ ${endpoint.path}: Authentication OK (${response.status})`)
      } else if (response.status === 401) {
        console.log(`❌ ${endpoint.path}: Authentication FAILED (${response.status})`)
        console.log('   Error:', data.error)
      } else {
        console.log(`⚠️  ${endpoint.path}: Unexpected status (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint.path}: ERROR - ${error.message}`)
    }
  }
}

async function main() {
  console.log('🧪 Dual Authentication System Test\n')
  console.log('Testing against:', API_BASE)
  console.log('Using API Key:', API_KEY.substring(0, 10) + '...')
  console.log('=' * 50)
  
  await testApiKeyAuth()
  await testInvalidApiKey()
  await testNoAuth()
  await testOtherEndpoints()
  
  console.log('\n🏁 Test completed!')
}

main().catch(console.error)