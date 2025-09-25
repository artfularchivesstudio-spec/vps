#!/usr/bin/env node

/**
 * 🔍 Debug Posts Audio Status
 * Checks the current state of posts and their audio status
 */

const BASE_URL = 'https://artful-archives-website-pb1pktveg-gsinghdevs-projects.vercel.app'
const API_KEY = process.env.HOOKS_API_KEY

async function debugPostsAudio() {
  console.log('🔍 Debugging Posts Audio Status...')
  
  try {
    // Check a specific post that we know has audio
    const postId = 'cbc72f09-623c-48a0-8974-a3c5e4c8c8b3' // The Osprey post from your screenshot
    
    console.log(`\n📋 Checking post: ${postId}`)
    
    // Check if we can access the posts API
    const postsResponse = await fetch(`${BASE_URL}/api/posts`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    })
    
    if (postsResponse.ok) {
      const posts = await postsResponse.json()
      const targetPost = posts.find(p => p.id === postId || p.slug.includes('osprey'))
      
      if (targetPost) {
        console.log('✅ Found target post:')
        console.log(`   Title: ${targetPost.title}`)
        console.log(`   ID: ${targetPost.id}`)
        console.log(`   primary_audio_id: ${targetPost.primary_audio_id || 'NULL'}`)
        console.log(`   Status: ${targetPost.status}`)
        
        // Check for audio jobs
        const jobsResponse = await fetch(`${BASE_URL}/api/audio-jobs/batch-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ post_ids: [targetPost.id] })
        })
        
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json()
          console.log('🎵 Audio jobs data:', JSON.stringify(jobsData, null, 2))
        } else {
          console.log('⚠️ Could not fetch audio jobs:', jobsResponse.status)
        }
        
      } else {
        console.log('❌ Could not find the target post')
        console.log(`📊 Total posts found: ${posts.length}`)
        console.log('🔍 First few posts:')
        posts.slice(0, 3).forEach(p => {
          console.log(`   - ${p.title} (${p.id}) - primary_audio_id: ${p.primary_audio_id || 'NULL'}`)
        })
      }
    } else {
      console.log('❌ Could not access posts API:', postsResponse.status)
    }
    
    // Test the repair endpoint
    console.log('\n🔧 Testing repair endpoint...')
    const repairResponse = await fetch(`${BASE_URL}/api/audio-jobs/repair`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (repairResponse.ok) {
      const repairResult = await repairResponse.json()
      console.log('✅ Repair endpoint result:', JSON.stringify(repairResult, null, 2))
    } else {
      const errorText = await repairResponse.text()
      console.log('❌ Repair endpoint failed:', repairResponse.status, errorText)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

// Run the debug
debugPostsAudio().catch(console.error)
