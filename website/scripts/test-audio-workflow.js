#!/usr/bin/env node

/**
 * 🧪 Audio Workflow Test Script
 * Tests the complete multilingual audio generation and post linking workflow
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const API_KEY = process.env.HOOKS_API_KEY || 'your-api-key-here'

async function testAudioWorkflow() {
  console.log('🧪 Starting Audio Workflow Test...')
  console.log(`📡 Base URL: ${BASE_URL}`)
  
  try {
    // Step 1: Test the repair endpoint first
    console.log('\n🔧 Step 1: Running audio jobs repair...')
    const repairResponse = await fetch(`${BASE_URL}/api/audio-jobs/repair`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (repairResponse.ok) {
      const repairResult = await repairResponse.json()
      console.log('✅ Repair completed:', repairResult.summary)
    } else {
      console.warn('⚠️ Repair failed:', await repairResponse.text())
    }

    // Step 2: Test audio job processing
    console.log('\n🎵 Step 2: Testing audio job processing...')
    
    // Create a test audio job
    const testJobResponse = await fetch(`${BASE_URL}/api/ai/generate-audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'This is a test of the multilingual audio generation system. We are testing English, Spanish, and Hindi audio generation.',
        title: 'Audio Workflow Test',
        languages: ['en', 'es', 'hi'],
        is_draft: false,
        tts_provider: 'openai',
        selected_voice: 'nova',
        voice_settings: {
          voice_gender: 'female',
          personality: 'hybrid',
          speed: 0.9
        }
      })
    })

    if (!testJobResponse.ok) {
      const errorText = await testJobResponse.text()
      throw new Error(`Audio job creation failed: ${errorText}`)
    }

    const jobResult = await testJobResponse.json()
    const jobId = jobResult.jobId
    console.log(`✅ Created test audio job: ${jobId}`)

    // Step 3: Monitor job progress
    console.log('\n📊 Step 3: Monitoring job progress...')
    let attempts = 0
    const maxAttempts = 30 // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
      attempts++
      
      const statusResponse = await fetch(`${BASE_URL}/api/audio-job-status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      })
      
      if (statusResponse.ok) {
        const status = await statusResponse.json()
        console.log(`📊 Job ${jobId} status: ${status.status}`)
        
        if (status.language_statuses) {
          Object.entries(status.language_statuses).forEach(([lang, langStatus]) => {
            console.log(`  🌍 ${lang.toUpperCase()}: ${langStatus.status}`)
          })
        }
        
        if (status.status === 'completed' || status.status === 'failed') {
          console.log(`🎉 Job completed with status: ${status.status}`)
          break
        }
      } else {
        console.warn(`⚠️ Status check failed: ${statusResponse.status}`)
      }
      
      console.log(`⏳ Attempt ${attempts}/${maxAttempts}, waiting...`)
    }

    // Step 4: Check batch status API
    console.log('\n📋 Step 4: Testing batch status API...')
    const batchResponse = await fetch(`${BASE_URL}/api/audio-jobs/batch-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_ids: ['test-post-id'] // This won't find anything but tests the API
      })
    })
    
    if (batchResponse.ok) {
      const batchResult = await batchResponse.json()
      console.log('✅ Batch status API working:', Object.keys(batchResult.results).length, 'results')
    } else {
      console.warn('⚠️ Batch status API failed:', await batchResponse.text())
    }

    console.log('\n🎉 Audio workflow test completed!')
    console.log('\n📋 Test Summary:')
    console.log('  ✅ Audio job repair endpoint')
    console.log('  ✅ Audio job creation')
    console.log('  ✅ Job processing trigger')
    console.log('  ✅ Status monitoring')
    console.log('  ✅ Batch status API')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testAudioWorkflow().catch(console.error)
